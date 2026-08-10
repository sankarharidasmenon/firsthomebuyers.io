import { describe, it, expect } from 'vitest'
import {
  buildEligibilityResult,
  type ApiScheme,
  type EligibilityAnswers,
} from '@/lib/schemes/eligibilityClient'

/**
 * Near-miss detection works by counterfactual re-evaluation: a suggestion is
 * only made when re-running the engine with exactly ONE changed answer lifts
 * the scheme out of 'no'. These tests pin the honesty guarantee — a scheme
 * sunk by a second, immovable failure must never produce a suggestion — and
 * the three actionable dimensions (price, category, deposit).
 */

/** A first-home grant with a hard price cap, applicable in VIC. */
function capGrant(overrides: Partial<ApiScheme> = {}): ApiScheme {
  return {
    scheme_id: 'test-cap-grant',
    scheme_name: 'Test First Home Grant',
    type: 'Grant',
    benefit_value: '$10,000',
    status: 'Active',
    applicable_states: 'VIC',
    first_home_buyer_required: 'Yes',
    property_price_cap: '$750,000',
    official_url: 'https://example.gov.au',
    ...overrides,
  }
}

/** Answers that satisfy every rule of `capGrant` except where overridden. */
function answers(overrides: Partial<EligibilityAnswers> = {}, ra: Record<string, unknown> = {}): EligibilityAnswers {
  return {
    state: 'VIC',
    firstHomeBuyer: true,
    income: 90_000,
    hasPartner: false,
    propertyPrice: 650_000,
    deposit: 50_000,
    propertyType: 'house',
    propertyCategory: 'new',
    rawAnswers: {
      is18: 'Yes',
      citizenship: 'Australian Citizen',
      everOwned: 'No',
      hasPartner: 'No',
      priorBenefit: 'No',
      ppr: 'Yes',
      moveIn: 'Yes',
      propertyType: 'New',
      entity: 'Individual',
      ...ra,
    },
    ...overrides,
  }
}

function evaluate(scheme: ApiScheme, a: EligibilityAnswers) {
  return buildEligibilityResult([scheme], a).items[0]
}

describe('near miss — price cap', () => {
  it('suggests the cap when price is the only failure', () => {
    const item = evaluate(capGrant(), answers({ propertyPrice: 900_000 }))
    expect(item.bucket).toBe('no')
    expect(item.nearMiss?.kind).toBe('price')
    expect(item.nearMiss?.message).toContain('$150,000 over the $750,000 price cap')
    expect(item.nearMiss?.shortLabel).toBe('$150k over cap')
    expect(item.eg.alternative).toContain('Near miss:')
  })

  it('stays silent when a second, immovable failure would remain', () => {
    // Over the cap AND previously owned property — lowering the price alone
    // does not rescue it, so no suggestion may be made.
    const item = evaluate(
      capGrant(),
      answers({ propertyPrice: 900_000, firstHomeBuyer: false }, { everOwned: 'Yes' })
    )
    expect(item.bucket).toBe('no')
    expect(item.nearMiss).toBeUndefined()
    expect(item.eg.alternative).toBeUndefined()
  })

  it('makes no suggestion for an eligible scheme', () => {
    const item = evaluate(capGrant(), answers())
    expect(item.bucket).toBe('yes')
    expect(item.nearMiss).toBeUndefined()
  })
})

describe('near miss — new vs established', () => {
  it('suggests buying new when the category is the only failure', () => {
    const item = evaluate(
      capGrant({ eligible_property_types: 'House, Townhouse', new_vs_established: 'New homes only' }),
      answers({ propertyCategory: 'established' }, { propertyType: 'Established (Existing)' })
    )
    expect(item.bucket).toBe('no')
    expect(item.nearMiss?.kind).toBe('category')
    expect(item.nearMiss?.message).toContain('new')
    expect(item.nearMiss?.shortLabel).toBe('if buying new')
  })
})

describe('near miss — deposit shortfall', () => {
  it('quantifies the top-up when the deposit is the only failure', () => {
    // 5% of $650,000 = $32,500; the applicant has $20,000 → $12,500 short.
    const item = evaluate(
      capGrant({ property_price_cap: null, minimum_deposit: '5%', type: 'Guarantee' }),
      answers({ deposit: 20_000 })
    )
    expect(item.bucket).toBe('no')
    expect(item.nearMiss?.kind).toBe('deposit')
    expect(item.nearMiss?.message).toContain('$12,500 short')
    expect(item.nearMiss?.shortLabel).toBe('$13k more deposit')
  })
})

describe('near miss — never suggests the unchangeable', () => {
  it('wrong-state schemes never get a suggestion', () => {
    const item = evaluate(
      capGrant({ applicable_states: 'QLD' }),
      answers({ propertyPrice: 900_000 })
    )
    expect(item.bucket).toBe('no')
    expect(item.nearMiss).toBeUndefined()
  })
})
