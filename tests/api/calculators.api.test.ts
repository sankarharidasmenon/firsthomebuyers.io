import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type SupabaseResult,
} from '../integration/helpers/fakeSupabase'
import { jsonRequest, malformedJsonRequest, readJson } from './helpers/request'

/**
 * API — the two public calculation endpoints.
 *
 *   POST /api/grant-calculator  — the three-input calculator engine
 *   POST /api/eligibility       — the full questionnaire rule engine
 *
 * Both are unauthenticated, read-only, and take a JSON body, so input
 * validation is the whole security surface. Only the Supabase driver is mocked;
 * the repository and both engines run for real.
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

const { POST: calculatorPost } = await import('@/app/api/grant-calculator/route')
const { POST: eligibilityPost } = await import('@/app/api/eligibility/route')

function dbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    scheme_id: 'fhog-nsw',
    scheme_name: 'First Home Owner Grant (NSW)',
    type: 'Grant',
    status: 'Open',
    applicable_states: 'NSW',
    benefit_value: '$10,000',
    eligible_property_types: 'New home; Established home',
    property_price_cap: '$750,000',
    official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
    priority_ranking: '1',
    imported_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function useRows(rows: Record<string, unknown>[]) {
  const responder = (call: CallRecord): SupabaseResult =>
    call.kind === 'query' ? { data: rows, error: null } : { data: null, error: null }
  dbRef.current = createFakeSupabase({ responder })
  return dbRef.current
}

function useDbError(message: string) {
  dbRef.current = createFakeSupabase({ responder: () => ({ data: null, error: { message } }) })
}

beforeEach(() => {
  useRows([dbRow()])
})

/* ── /api/grant-calculator ────────────────────────────────────────────────── */

interface CalculatorResponse {
  grants: Array<{ id: string; value: number | string }>
  schemes: Array<{ id: string }>
  duty: { payable: number | null; calculable: boolean } | null
  cashGrantsTotal: number
  stampDutySaving: number
  totalValue: number
}

const calculate = (body: unknown) => calculatorPost(jsonRequest('/api/grant-calculator', body))

const validCalculatorBody = (overrides: Record<string, unknown> = {}) => ({
  state: 'NSW',
  propertyType: 'house',
  propertyPrice: 700_000,
  ...overrides,
})

describe('POST /api/grant-calculator — success', () => {
  it('returns 200 with a fully-formed result', async () => {
    const { status, body } = await readJson<CalculatorResponse>(
      await calculate(validCalculatorBody()),
    )

    expect(status).toBe(200)
    expect(body).toMatchObject({
      grants: expect.any(Array),
      schemes: expect.any(Array),
      cashGrantsTotal: expect.any(Number),
      stampDutySaving: expect.any(Number),
      totalValue: expect.any(Number),
    })
  })

  it('totals cash grants and duty savings', async () => {
    const { body } = await readJson<CalculatorResponse>(await calculate(validCalculatorBody()))

    expect(body.cashGrantsTotal).toBe(10_000)
    expect(body.totalValue).toBe(body.cashGrantsTotal + body.stampDutySaving)
  })

  it('accepts a lower-case state code', async () => {
    const { status, body } = await readJson<CalculatorResponse>(
      await calculate(validCalculatorBody({ state: 'nsw' })),
    )

    expect(status).toBe(200)
    expect(body.grants).toHaveLength(1)
  })

  it('accepts a zero property price', async () => {
    const { status } = await readJson(await calculate(validCalculatorBody({ propertyPrice: 0 })))
    expect(status).toBe(200)
  })

  it('accepts a numeric string price', async () => {
    const { status } = await readJson(
      await calculate(validCalculatorBody({ propertyPrice: '700000' })),
    )
    expect(status).toBe(200)
  })

  it('returns a null duty outcome for a state with no schedule', async () => {
    const { body } = await readJson<CalculatorResponse>(
      await calculate(validCalculatorBody({ state: 'TAS' })),
    )
    expect(body.duty).toBeNull()
    expect(body.stampDutySaving).toBe(0)
  })

  it.each(['house', 'townhouse', 'apartment', 'offplan'])(
    'accepts property type %s',
    async (propertyType) => {
      const { status } = await readJson(await calculate(validCalculatorBody({ propertyType })))
      expect(status).toBe(200)
    },
  )
})

describe('POST /api/grant-calculator — validation failures', () => {
  it.each([
    ['an unknown state', { state: 'XX' }],
    ['a missing state', { state: undefined }],
    ['an empty state', { state: '' }],
    ['a full state name', { state: 'New South Wales' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(
      await calculate(validCalculatorBody(overrides)),
    )

    expect(status).toBe(400)
    expect(body.error).toMatch(/unknown state/i)
  })

  it.each([
    ['an unknown property type', { propertyType: 'castle' }],
    ['a missing property type', { propertyType: undefined }],
    ['a capitalised property type', { propertyType: 'House' }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(
      await calculate(validCalculatorBody(overrides)),
    )

    expect(status).toBe(400)
    expect(body.error).toMatch(/property type/i)
  })

  it.each([
    ['a negative price', { propertyPrice: -1 }],
    ['a non-numeric price', { propertyPrice: 'expensive' }],
    ['a missing price', { propertyPrice: undefined }],
    ['an object price', { propertyPrice: {} }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(
      await calculate(validCalculatorBody(overrides)),
    )

    expect(status).toBe(400)
    expect(body.error).toMatch(/property price/i)
  })

  it('does not query the database when validation fails', async () => {
    const db = useRows([dbRow()])
    await calculate(validCalculatorBody({ state: 'XX' }))
    expect(db.calls).toHaveLength(0)
  })

  it('rejects an entirely empty body', async () => {
    const { status } = await readJson(await calculate({}))
    expect(status).toBe(400)
  })

  /**
   * JSON has no NaN literal — JSON.stringify turns it into null — so a NaN
   * price cannot reach this endpoint over HTTP. A null price coerces to 0,
   * which the handler accepts as "no price entered". Documented so nobody adds
   * a NaN rejection test that can never fire.
   */
  it('treats a null price as zero rather than rejecting it', async () => {
    const { status, body } = await readJson<CalculatorResponse>(
      await calculate(validCalculatorBody({ propertyPrice: null })),
    )

    expect(status).toBe(200)
    expect(body.duty).toBeNull()
  })
})

describe('POST /api/grant-calculator — error handling', () => {
  it('returns 500 when the scheme lookup fails', async () => {
    useDbError('connection reset by peer')

    const { status, body } = await readJson<{ error: string }>(
      await calculate(validCalculatorBody()),
    )

    expect(status).toBe(500)
    expect(body.error).toMatch(/connection reset/)
  })

  /** See "Remaining API gaps": malformed JSON surfaces as 500, not 400. */
  it('returns 500 for a malformed JSON body', async () => {
    const { status } = await readJson(
      await calculatorPost(malformedJsonRequest('/api/grant-calculator')),
    )
    expect(status).toBe(500)
  })
})

/* ── /api/eligibility ─────────────────────────────────────────────────────── */

const evaluate = (body: unknown) => eligibilityPost(jsonRequest('/api/eligibility', body))

describe('POST /api/eligibility — success', () => {
  it('returns 200 for a payload carrying a state', async () => {
    const { status, body } = await readJson<Record<string, unknown>>(
      await evaluate({ state: 'NSW', isFirstHomeBuyer: true }),
    )

    expect(status).toBe(200)
    expect(body).toBeTypeOf('object')
    expect(body.error).toBeUndefined()
  })

  it('reads scheme metadata from the database', async () => {
    const db = useRows([dbRow()])
    await evaluate({ state: 'NSW' })

    expect(db.queriesFor('government_schemes').length).toBeGreaterThan(0)
  })

  it('responds with a JSON content type', async () => {
    const response = await evaluate({ state: 'NSW' })
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })

  it('copes with an empty scheme table', async () => {
    useRows([])
    const { status } = await readJson(await evaluate({ state: 'NSW' }))
    expect(status).toBe(200)
  })
})

describe('POST /api/eligibility — validation failures', () => {
  it.each([
    ['a missing state', {}],
    ['a null state', { state: null }],
    ['a numeric state', { state: 123 }],
  ])('rejects %s with 400', async (_label, body) => {
    const { status, body: responseBody } = await readJson<{ error: string }>(await evaluate(body))

    expect(status).toBe(400)
    expect(responseBody.error).toMatch(/state/i)
  })

  it('rejects a null body', async () => {
    const { status } = await readJson(await evaluate(null))
    expect(status).toBe(400)
  })

  it('does not query the database when validation fails', async () => {
    const db = useRows([dbRow()])
    await evaluate({})
    expect(db.calls).toHaveLength(0)
  })
})

describe('POST /api/eligibility — error handling', () => {
  it('returns 500 when the scheme lookup fails', async () => {
    useDbError('statement timeout')

    const { status, body } = await readJson<{ error: string }>(await evaluate({ state: 'NSW' }))

    expect(status).toBe(500)
    expect(body.error).toMatch(/statement timeout/)
  })

  it('returns 500 for a malformed JSON body', async () => {
    const { status } = await readJson(await eligibilityPost(malformedJsonRequest('/api/eligibility')))
    expect(status).toBe(500)
  })
})
