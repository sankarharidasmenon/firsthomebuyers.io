import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type SupabaseResult,
} from '../helpers/fakeSupabase'

/**
 * INTEGRATION — scheme repository and the business logic sitting on top of it.
 *
 *   Supabase rows -> repository (query shape, ordering, error surfacing)
 *                 -> grant calculator (real eligibility + duty arithmetic)
 *
 * The last suite is the point of this file: it feeds DATABASE-SHAPED rows —
 * every column a nullable string, exactly as Postgres returns them — into the
 * real calculator. Unit tests use hand-made fixtures with tidy values, so they
 * cannot catch a mismatch between what the database stores and what the domain
 * logic expects.
 */

const dbRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))

vi.mock('@/lib/supabase/server', () => ({
  getPublicClient: () => {
    if (!dbRef.current) throw new Error('fake db client not initialised')
    return dbRef.current.client
  },
  getAdminClient: () => {
    if (!dbRef.current) throw new Error('fake db client not initialised')
    return dbRef.current.client
  },
  isSupabaseConfigured: () => true,
}))

const { listSchemes, getScheme, listFeatured } = await import('@/lib/schemes/repository')
const { calculateGrants } = await import('@/lib/calculator/grantCalculator')

/** A row shaped the way Postgres returns it: every column a nullable string. */
function dbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    scheme_id: 'fhog-nsw',
    scheme_name: 'First Home Owner Grant (NSW)',
    acronym: 'FHOG',
    type: 'Grant',
    level: 'State',
    administering_body: 'Revenue NSW',
    short_description: 'One-off payment for eligible first home buyers.',
    detailed_description: null,
    applicable_states: 'NSW',
    benefit_type: 'Cash grant',
    benefit_value: '$10,000',
    value_unit: 'AUD',
    max_value_cap: null,
    property_price_cap: '$750,000',
    price_cap_variations: null,
    eligible_property_types: 'New home; Established home',
    new_vs_established: null,
    status: 'Open',
    official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
    priority_ranking: '1',
    imported_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function respondTo(rows: Record<string, unknown>[]): (call: CallRecord) => SupabaseResult {
  return (call) => {
    if (call.kind !== 'query') return { data: null, error: null }
    // getScheme narrows by a filter; listSchemes does not.
    if (call.filters.length > 0) {
      const { column, value } = call.filters[0]
      const match = rows.find((r) => r[column] === value)
      return { data: match ?? null, error: null }
    }
    return { data: rows, error: null }
  }
}

function useRows(rows: Record<string, unknown>[]) {
  dbRef.current = createFakeSupabase({ responder: respondTo(rows) })
  return dbRef.current
}

beforeEach(() => {
  useRows([dbRow()])
})

describe('listSchemes', () => {
  it('returns every scheme the database provides', async () => {
    useRows([dbRow({ scheme_id: 'a' }), dbRow({ scheme_id: 'b' })])
    const schemes = await listSchemes()
    expect(schemes.map((s) => s.scheme_id)).toEqual(['a', 'b'])
  })

  it('reads from the government_schemes table', async () => {
    const db = useRows([dbRow()])
    await listSchemes()
    expect(db.queries[0].table).toBe('government_schemes')
    expect(db.queries[0].operation).toBe('select')
  })

  /** Ordering is a product decision (priority, then name) — pin it. */
  it('orders by priority ranking, then scheme name', async () => {
    const db = useRows([dbRow()])
    await listSchemes()

    expect(db.queries[0].orders).toEqual([
      { column: 'priority_ranking', ascending: true },
      { column: 'scheme_name', ascending: true },
    ])
  })

  it('returns an empty list rather than null when the table is empty', async () => {
    dbRef.current = createFakeSupabase({ responder: () => ({ data: null, error: null }) })
    expect(await listSchemes()).toEqual([])
  })

  it('surfaces a database error as a thrown error', async () => {
    dbRef.current = createFakeSupabase({
      responder: () => ({ data: null, error: { message: 'permission denied for table' } }),
    })
    await expect(listSchemes()).rejects.toThrow(/permission denied/)
  })
})

describe('getScheme', () => {
  it('finds a scheme by its business scheme_id', async () => {
    useRows([dbRow({ scheme_id: 'fhog-nsw' })])
    const scheme = await getScheme('fhog-nsw')
    expect(scheme?.scheme_name).toBe('First Home Owner Grant (NSW)')
  })

  it('queries scheme_id first', async () => {
    const db = useRows([dbRow()])
    await getScheme('fhog-nsw')
    expect(db.queries[0].filters).toEqual([{ column: 'scheme_id', value: 'fhog-nsw' }])
  })

  it('falls back to the uuid primary key when the business id misses', async () => {
    const uuid = '11111111-2222-3333-4444-555555555555'
    const db = useRows([dbRow({ scheme_id: 'something-else', id: uuid })])

    const scheme = await getScheme(uuid)

    expect(scheme?.id).toBe(uuid)
    expect(db.queries).toHaveLength(2)
    expect(db.queries[1].filters).toEqual([{ column: 'id', value: uuid }])
  })

  /** A non-uuid miss must not trigger a second query — it cannot match a uuid PK. */
  it('does not attempt a uuid lookup for a non-uuid id', async () => {
    const db = useRows([dbRow({ scheme_id: 'other' })])

    expect(await getScheme('does-not-exist')).toBeNull()
    expect(db.queries).toHaveLength(1)
  })

  it('returns null for a uuid that matches nothing', async () => {
    useRows([dbRow({ scheme_id: 'other', id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' })])
    expect(await getScheme('99999999-8888-7777-6666-555555555555')).toBeNull()
  })

  it('surfaces a database error as a thrown error', async () => {
    dbRef.current = createFakeSupabase({
      responder: () => ({ data: null, error: { message: 'connection reset' } }),
    })
    await expect(getScheme('fhog-nsw')).rejects.toThrow(/connection reset/)
  })
})

describe('listFeatured', () => {
  it('hides schemes that are no longer taking applicants', async () => {
    useRows([
      dbRow({ scheme_id: 'open-one', status: 'Open' }),
      dbRow({ scheme_id: 'closed-one', status: 'Closed' }),
      dbRow({ scheme_id: 'active-one', status: 'Active' }),
    ])

    const featured = await listFeatured()
    expect(featured.map((s) => s.scheme_id)).toEqual(['open-one', 'active-one'])
  })

  it('keeps a scheme with no status recorded', async () => {
    useRows([dbRow({ scheme_id: 'unknown-status', status: null })])
    expect(await listFeatured()).toHaveLength(1)
  })

  it('honours the requested limit', async () => {
    useRows(Array.from({ length: 10 }, (_, i) => dbRow({ scheme_id: `s-${i}` })))
    expect(await listFeatured(3)).toHaveLength(3)
  })

  it('defaults to six featured schemes', async () => {
    useRows(Array.from({ length: 10 }, (_, i) => dbRow({ scheme_id: `s-${i}` })))
    expect(await listFeatured()).toHaveLength(6)
  })
})

describe('database rows through the real grant calculator', () => {
  it('turns stored schemes into a costed result for an applicant', async () => {
    useRows([
      dbRow({ scheme_id: 'fhog-nsw', benefit_value: '$10,000', applicable_states: 'NSW' }),
      dbRow({
        scheme_id: 'fhbg',
        scheme_name: 'First Home Guarantee',
        type: 'Scheme',
        benefit_value: 'LMI waived',
        applicable_states: 'All States',
        property_price_cap: '$900,000',
        official_url: 'https://www.housingaustralia.gov.au/support-buy-home',
      }),
    ])

    const schemes = await listSchemes()
    const result = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 700_000,
    })

    expect(result.grants.map((g) => g.id)).toEqual(['fhog-nsw'])
    expect(result.cashGrantsTotal).toBe(10_000)
    expect(result.schemes.map((s) => s.id)).toEqual(['fhbg'])

    // NSW first home duty is a full exemption to $800,000.
    expect(result.duty?.payable).toBe(0)
    expect(result.stampDutySaving).toBeGreaterThan(0)
    expect(result.totalValue).toBe(result.cashGrantsTotal + result.stampDutySaving)
  })

  it('applies the stored price cap to exclude an over-cap property', async () => {
    useRows([dbRow({ property_price_cap: '$750,000' })])
    const schemes = await listSchemes()

    const under = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 700_000,
    })
    const over = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 800_000,
    })

    expect(under.grants).toHaveLength(1)
    expect(over.grants).toHaveLength(0)
  })

  it('excludes a stored scheme from a state the applicant is not buying in', async () => {
    useRows([dbRow({ applicable_states: 'VIC' })])
    const schemes = await listSchemes()

    const result = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 650_000,
    })
    expect(result.grants).toHaveLength(0)
  })

  /**
   * Null-heavy rows are the normal case in this table — most of the 56 columns
   * are empty for any given scheme. The calculator must cope without throwing.
   */
  it('tolerates a sparsely populated row', async () => {
    useRows([
      {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        scheme_id: 'sparse',
        scheme_name: 'Sparse Scheme',
        official_url: 'https://example.gov.au',
        type: null,
        benefit_value: null,
        status: null,
        applicable_states: null,
        eligible_property_types: null,
        property_price_cap: null,
        price_cap_variations: null,
        imported_at: '2026-07-01T00:00:00.000Z',
      },
    ])

    const schemes = await listSchemes()
    expect(() =>
      calculateGrants(schemes, { state: 'NSW', propertyType: 'house', propertyPrice: 650_000 }),
    ).not.toThrow()

    const result = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 650_000,
    })
    expect(result.schemes.map((s) => s.id)).toEqual(['sparse'])
    expect(result.cashGrantsTotal).toBe(0)
  })

  it('does not offer a closed scheme even if the database still stores it', async () => {
    useRows([dbRow({ status: 'Closed' })])
    const schemes = await listSchemes()

    const result = calculateGrants(schemes, {
      state: 'NSW',
      propertyType: 'house',
      propertyPrice: 650_000,
    })
    expect(result.grants).toHaveLength(0)
    expect(result.schemes).toHaveLength(0)
  })
})
