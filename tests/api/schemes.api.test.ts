import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeSupabase, type CallRecord, type FakeSupabase, type SupabaseResult } from '../integration/helpers/fakeSupabase'
import { getRequest, readJson } from './helpers/request'

/**
 * API — public scheme read endpoints.
 *
 *   GET /api/schemes
 *   GET /api/schemes/featured
 *   GET /api/schemes/[id]
 *
 * Handlers are invoked directly with real Request objects. Only the Supabase
 * driver is mocked (reusing the Phase 3 fake), so the repository, its ordering
 * and its error surfacing all run for real.
 */

const dbRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))

vi.mock('@/lib/supabase/server', () => ({
  getPublicClient: () => {
    if (!dbRef.current) throw new Error('fake db not initialised')
    return dbRef.current.client
  },
  getAdminClient: () => {
    if (!dbRef.current) throw new Error('fake db not initialised')
    return dbRef.current.client
  },
  isSupabaseConfigured: () => true,
}))

const { GET: getSchemes } = await import('@/app/api/schemes/route')
const { GET: getFeatured } = await import('@/app/api/schemes/featured/route')
const { GET: getSchemeById } = await import('@/app/api/schemes/[id]/route')

function dbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    scheme_id: 'fhog-nsw',
    scheme_name: 'First Home Owner Grant (NSW)',
    type: 'Grant',
    status: 'Open',
    applicable_states: 'NSW',
    benefit_value: '$10,000',
    official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
    priority_ranking: '1',
    imported_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function useRows(rows: Record<string, unknown>[]) {
  const responder = (call: CallRecord): SupabaseResult => {
    if (call.kind !== 'query') return { data: null, error: null }
    if (call.filters.length > 0) {
      const { column, value } = call.filters[0]
      return { data: rows.find((r) => r[column] === value) ?? null, error: null }
    }
    return { data: rows, error: null }
  }
  dbRef.current = createFakeSupabase({ responder })
  return dbRef.current
}

function useDbError(message: string) {
  dbRef.current = createFakeSupabase({ responder: () => ({ data: null, error: { message } }) })
}

beforeEach(() => {
  useRows([dbRow()])
})

describe('GET /api/schemes', () => {
  it('returns 200 with the scheme list and a count', async () => {
    useRows([dbRow({ scheme_id: 'a' }), dbRow({ scheme_id: 'b' })])

    const { status, body } = await readJson<{ schemes: unknown[]; count: number }>(
      await getSchemes(),
    )

    expect(status).toBe(200)
    expect(body.count).toBe(2)
    expect(body.schemes).toHaveLength(2)
  })

  it('responds with a JSON content type', async () => {
    const response = await getSchemes()
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('returns an empty list with count 0 rather than 404 when there are no schemes', async () => {
    useRows([])
    const { status, body } = await readJson<{ schemes: unknown[]; count: number }>(
      await getSchemes(),
    )

    expect(status).toBe(200)
    expect(body.schemes).toEqual([])
    expect(body.count).toBe(0)
  })

  it('returns 500 and the reason when the database errors', async () => {
    useDbError('permission denied for table government_schemes')

    const { status, body } = await readJson<{ error: string }>(await getSchemes())

    expect(status).toBe(500)
    expect(body.error).toMatch(/permission denied/)
  })

  it('does not leak scheme data in an error response', async () => {
    useDbError('boom')
    const { body } = await readJson<Record<string, unknown>>(await getSchemes())
    expect(body.schemes).toBeUndefined()
  })
})

describe('GET /api/schemes/featured', () => {
  const manyRows = () => Array.from({ length: 10 }, (_, i) => dbRow({ scheme_id: `s-${i}` }))

  it('returns 200 with at most six schemes by default', async () => {
    useRows(manyRows())

    const { status, body } = await readJson<{ schemes: unknown[]; count: number }>(
      await getFeatured(getRequest('/api/schemes/featured')),
    )

    expect(status).toBe(200)
    expect(body.count).toBe(6)
  })

  it('honours an explicit ?limit', async () => {
    useRows(manyRows())
    const { body } = await readJson<{ count: number }>(
      await getFeatured(getRequest('/api/schemes/featured?limit=3')),
    )
    expect(body.count).toBe(3)
  })

  it('falls back to six for a non-numeric limit', async () => {
    useRows(manyRows())
    const { body } = await readJson<{ count: number }>(
      await getFeatured(getRequest('/api/schemes/featured?limit=abc')),
    )
    expect(body.count).toBe(6)
  })

  it('falls back to six for limit=0', async () => {
    useRows(manyRows())
    const { body } = await readJson<{ count: number }>(
      await getFeatured(getRequest('/api/schemes/featured?limit=0')),
    )
    expect(body.count).toBe(6)
  })

  /**
   * EDGE CASE — a negative limit reaches Array.slice(0, -n), which drops items
   * from the END instead of rejecting the request. Documented here as current
   * behaviour; see "Remaining API gaps" in the Phase 4 report.
   */
  it('treats a negative limit as slice-from-the-end rather than rejecting it', async () => {
    useRows(manyRows())
    const { status, body } = await readJson<{ count: number }>(
      await getFeatured(getRequest('/api/schemes/featured?limit=-2')),
    )

    expect(status).toBe(200)
    expect(body.count).toBe(8)
  })

  it('excludes closed schemes from the featured list', async () => {
    useRows([
      dbRow({ scheme_id: 'open-one', status: 'Open' }),
      dbRow({ scheme_id: 'closed-one', status: 'Closed' }),
    ])

    const { body } = await readJson<{ schemes: Array<{ scheme_id: string }> }>(
      await getFeatured(getRequest('/api/schemes/featured')),
    )

    expect(body.schemes.map((s) => s.scheme_id)).toEqual(['open-one'])
  })

  it('returns 500 when the database errors', async () => {
    useDbError('connection reset')
    const { status, body } = await readJson<{ error: string }>(
      await getFeatured(getRequest('/api/schemes/featured')),
    )

    expect(status).toBe(500)
    expect(body.error).toMatch(/connection reset/)
  })
})

describe('GET /api/schemes/[id]', () => {
  /** Next 15+ delivers route params as a Promise. */
  const params = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns 200 with the scheme when found by business id', async () => {
    useRows([dbRow({ scheme_id: 'fhog-nsw' })])

    const { status, body } = await readJson<{ scheme: { scheme_id: string } }>(
      await getSchemeById(getRequest('/api/schemes/fhog-nsw'), params('fhog-nsw')),
    )

    expect(status).toBe(200)
    expect(body.scheme.scheme_id).toBe('fhog-nsw')
  })

  it('resolves a scheme by its uuid primary key', async () => {
    const uuid = '11111111-2222-3333-4444-555555555555'
    useRows([dbRow({ scheme_id: 'other', id: uuid })])

    const { status, body } = await readJson<{ scheme: { id: string } }>(
      await getSchemeById(getRequest(`/api/schemes/${uuid}`), params(uuid)),
    )

    expect(status).toBe(200)
    expect(body.scheme.id).toBe(uuid)
  })

  it('returns 404 with the requested id when nothing matches', async () => {
    useRows([dbRow({ scheme_id: 'something-else' })])

    const { status, body } = await readJson<{ error: string }>(
      await getSchemeById(getRequest('/api/schemes/nope'), params('nope')),
    )

    expect(status).toBe(404)
    expect(body.error).toContain('nope')
  })

  it('returns 404 rather than 500 for an empty id', async () => {
    useRows([dbRow()])
    const { status } = await readJson(
      await getSchemeById(getRequest('/api/schemes/'), params('')),
    )
    expect(status).toBe(404)
  })

  it('returns 500 when the database errors', async () => {
    useDbError('statement timeout')

    const { status, body } = await readJson<{ error: string }>(
      await getSchemeById(getRequest('/api/schemes/fhog-nsw'), params('fhog-nsw')),
    )

    expect(status).toBe(500)
    expect(body.error).toMatch(/statement timeout/)
  })

  /** A 404 body must not carry a partial scheme object. */
  it('returns only an error field on 404', async () => {
    useRows([])
    const { body } = await readJson<Record<string, unknown>>(
      await getSchemeById(getRequest('/api/schemes/x'), params('x')),
    )
    expect(Object.keys(body)).toEqual(['error'])
  })
})
