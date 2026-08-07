import { describe, it, expect } from 'vitest'
import {
  standardDuty,
  firstHomeDuty,
  supportsDuty,
  formatDuty,
  type DutyState,
} from '@/lib/schemes/stampDuty'

/**
 * Stamp duty is the highest-risk arithmetic in the product: it drives a dollar
 * figure a user may act on financially, and it encodes seven separate published
 * rate schedules.
 *
 * Where possible the expected values below are the OFFICIAL worked examples
 * quoted in the module's own source comments, so these tests verify the
 * implementation against the revenue offices' arithmetic rather than against
 * itself.
 */

const ALL_STATES: DutyState[] = ['NSW', 'VIC', 'QLD', 'SA', 'ACT', 'WA', 'NT']

describe('standardDuty — guards', () => {
  it.each([0, -1, -100000])('returns 0 for a non-positive price (%i)', (price) => {
    expect(standardDuty('NSW', price)).toBe(0)
  })

  it.each([NaN, Infinity, -Infinity])('returns 0 for a non-finite price', (price) => {
    expect(standardDuty('NSW', price)).toBe(0)
  })

  it('is monotonic — a dearer property never attracts less duty', () => {
    for (const state of ALL_STATES) {
      let previous = 0
      for (let price = 50_000; price <= 1_500_000; price += 50_000) {
        const duty = standardDuty(state, price)
        expect(duty, `${state} at $${price} went backwards`).toBeGreaterThanOrEqual(previous)
        previous = duty
      }
    }
  })
})

describe('standardDuty — official worked examples', () => {
  // Revenue NSW general transfer duty. $30,187 is the figure quoted in the
  // formatDuty doc comment.
  it('NSW: $800,000 attracts $30,187', () => {
    expect(standardDuty('NSW', 800_000)).toBe(30_187)
  })

  // RevenueWA cross-check quoted in the WA_GENERAL comment: the historical FHOR
  // tapers were calibrated to meet these general-rate figures at their caps.
  it('WA: $700,000 attracts $27,265', () => {
    expect(standardDuty('WA', 700_000)).toBe(27_265)
  })

  it('WA: $750,000 attracts $29,740.50', () => {
    expect(standardDuty('WA', 750_000)).toBe(29_740.5)
  })

  it('WA: $800,000 attracts $32,315.50', () => {
    expect(standardDuty('WA', 800_000)).toBe(32_315.5)
  })

  // ACT determination DI2026-155: the flat band above $1,455,000 is a genuine
  // step up, not a continuation of the marginal scale.
  it('ACT: $1,455,000 attracts $63,078 on the marginal scale', () => {
    expect(standardDuty('ACT', 1_455_000)).toBe(63_078)
  })

  it('ACT: one dollar above the flat threshold steps UP, not smoothly', () => {
    const onScale = standardDuty('ACT', 1_455_000)
    const flat = standardDuty('ACT', 1_455_001)
    expect(flat).toBeGreaterThan(onScale)
    // 4.54% of the WHOLE dutiable value, per the determination.
    expect(flat).toBeCloseTo(0.0454 * 1_455_001, 2)
    expect(flat - onScale).toBeGreaterThan(2_900)
  })

  /**
   * Stamp Duty Act 1978 (NT) Schedule 1 cl 1(2). The quadratic is calibrated to
   * meet the 4.95% flat rate at its $525,000 ceiling; that near-continuity is
   * the check that the coefficients are transcribed correctly.
   *
   * Evaluating the legislated formula at V = 525:
   *   0.06571441 x 525^2 + 15 x 525 = 18,112.53 + 7,875 = $25,987.53
   *
   * NOTE — DOC DISCREPANCY (code is correct, comment is not): the module's own
   * source comment states "$25,987.60 ... a 10 cent difference". The formula
   * actually yields $25,987.53, and the gap to 4.95% of $525,000 ($25,987.50)
   * is 3 cents. The implementation matches the legislation; only the prose is
   * out by 7 cents. Asserted against the legislation, not the comment.
   */
  it('NT: the quadratic meets the flat rate at $525,000 within 10 cents', () => {
    const quadratic = standardDuty('NT', 525_000)
    const flatEquivalent = 0.0495 * 525_000
    expect(quadratic).toBeCloseTo(25_987.53, 2)
    expect(Math.abs(quadratic - flatEquivalent)).toBeLessThanOrEqual(0.1)
  })

  it('NT: above the ceiling the rate is flat on the whole value', () => {
    expect(standardDuty('NT', 600_000)).toBeCloseTo(0.0495 * 600_000, 2)
    expect(standardDuty('NT', 3_000_000)).toBeCloseTo(0.0575 * 3_000_000, 2)
    expect(standardDuty('NT', 5_000_000)).toBeCloseTo(0.0595 * 5_000_000, 2)
  })

  // VIC charges a flat 5.5% of the whole dutiable value from $960,001 to $2m.
  it('VIC: the $960,001–$2,000,000 band is a flat 5.5% of the whole value', () => {
    expect(standardDuty('VIC', 1_000_000)).toBe(Math.round(0.055 * 1_000_000))
    expect(standardDuty('VIC', 2_000_000)).toBe(Math.round(0.055 * 2_000_000))
  })

  it('VIC: the concessional PPR scale applies only up to $550,000', () => {
    // At the limit the PPR scale is in force; just above it the general scale is,
    // and the general scale is never cheaper.
    expect(standardDuty('VIC', 550_000)).toBeLessThan(standardDuty('VIC', 550_001))
  })
})

describe('standardDuty — "per $100 or part thereof" rounding', () => {
  /**
   * QLD, SA, WA and ACT round the excess UP to the next whole $100 before
   * applying the rate; NSW and VIC do not. A price that is not a multiple of
   * $100 is the only thing that distinguishes the two methods.
   */
  it('rounds the excess up in QLD, SA, WA and ACT', () => {
    for (const state of ['QLD', 'SA', 'WA', 'ACT'] as DutyState[]) {
      // $1 more than a round hundred costs the same as a full extra hundred.
      const atHundred = standardDuty(state, 600_000)
      const oneDollarMore = standardDuty(state, 600_001)
      const nextHundred = standardDuty(state, 600_100)
      expect(oneDollarMore, `${state}`).toBeGreaterThan(atHundred)
      expect(oneDollarMore, `${state}`).toBe(nextHundred)
    }
  })

  it('does NOT round the excess up in NSW', () => {
    expect(standardDuty('NSW', 600_001)).toBeLessThan(standardDuty('NSW', 600_100))
  })
})

describe('firstHomeDuty — NSW FHBAS', () => {
  it('is a full exemption up to $800,000', () => {
    const outcome = firstHomeDuty({ state: 'NSW' as DutyState, propertyPrice: 800_000 })
    expect(outcome.calculable).toBe(true)
    expect(outcome.payable).toBe(0)
    expect(outcome.saving).toBe(30_187)
    expect(outcome.note).toMatch(/full exemption/i)
  })

  it('refuses to guess in the $800,001–$999,999 concessional band', () => {
    const outcome = firstHomeDuty({ state: 'NSW' as DutyState, propertyPrice: 900_000 })
    expect(outcome.calculable).toBe(false)
    expect(outcome.payable).toBeNull()
    expect(outcome.saving).toBeNull()
    expect(outcome.note).toMatch(/Revenue NSW/i)
    // The standard figure is still reported even when the benefit is not.
    expect(outcome.standard).toBeGreaterThan(0)
  })

  it('gives no benefit at $1,000,000 and above', () => {
    const outcome = firstHomeDuty({ state: 'NSW' as DutyState, propertyPrice: 1_000_000 })
    expect(outcome.payable).toBe(outcome.standard)
    expect(outcome.saving).toBe(0)
  })
})

describe('firstHomeDuty — VIC', () => {
  it('is a full exemption up to $600,000', () => {
    const outcome = firstHomeDuty({ state: 'VIC' as DutyState, propertyPrice: 600_000 })
    expect(outcome.payable).toBe(0)
    expect(outcome.saving).toBe(outcome.standard)
  })

  it('tapers linearly through $600,001–$750,000', () => {
    const outcome = firstHomeDuty({ state: 'VIC' as DutyState, propertyPrice: 675_000 })
    // Halfway through the band => half the duty payable.
    expect(outcome.payable).toBe(Math.round(outcome.standard * 0.5))
    expect(outcome.saving).toBe(outcome.standard - (outcome.payable as number))
  })

  it('reaches full duty at the top of the taper', () => {
    const outcome = firstHomeDuty({ state: 'VIC' as DutyState, propertyPrice: 750_000 })
    expect(outcome.payable).toBe(outcome.standard)
    expect(outcome.saving).toBe(0)
  })

  it('gives no benefit above $750,000', () => {
    const outcome = firstHomeDuty({ state: 'VIC' as DutyState, propertyPrice: 800_000 })
    expect(outcome.payable).toBe(outcome.standard)
    expect(outcome.saving).toBe(0)
  })
})

describe('firstHomeDuty — QLD concession then rebate', () => {
  it('is a full concession below $700,000', () => {
    const outcome = firstHomeDuty({ state: 'QLD' as DutyState, propertyPrice: 699_999 })
    expect(outcome.payable).toBe(0)
    expect(outcome.saving).toBe(outcome.standard)
    expect(outcome.note).toMatch(/full first home concession/i)
  })

  it('applies the $17,350 rebate on top of the home concession at $705,000', () => {
    // Home concession duty at $705,000 is $17,575; the rebate is $17,350.
    const outcome = firstHomeDuty({ state: 'QLD' as DutyState, propertyPrice: 705_000 })
    expect(outcome.payable).toBe(225)
    expect(outcome.note).toMatch(/sliding-scale/i)
  })

  it('steps the rebate down in $10,000 bands', () => {
    const lower = firstHomeDuty({ state: 'QLD' as DutyState, propertyPrice: 705_000 }).payable as number
    const higher = firstHomeDuty({ state: 'QLD' as DutyState, propertyPrice: 795_000 }).payable as number
    expect(higher).toBeGreaterThan(lower)
  })

  it('drops to home concession only from $800,000', () => {
    const outcome = firstHomeDuty({ state: 'QLD' as DutyState, propertyPrice: 800_000 })
    expect(outcome.note).toMatch(/home concession only/i)
    expect(outcome.payable).toBeGreaterThan(0)
    // Still cheaper than the general rate — the home concession survives.
    expect(outcome.payable as number).toBeLessThan(outcome.standard)
  })
})

describe('firstHomeDuty — jurisdictions with uncapped full relief', () => {
  it.each([
    ['SA' as DutyState, /6 June 2024/],
    ['ACT' as DutyState, /1 July 2026/],
    ['NT' as DutyState, /30 June 2027/],
  ])('%s waives duty entirely at any price', (state, notePattern) => {
    for (const price of [400_000, 900_000, 2_500_000]) {
      const outcome = firstHomeDuty({ state: state as DutyState, propertyPrice: price })
      expect(outcome.calculable).toBe(true)
      expect(outcome.payable).toBe(0)
      expect(outcome.saving).toBe(outcome.standard)
      expect(outcome.note).toMatch(notePattern)
    }
  })
})

describe('firstHomeDuty — WA first home owner rate', () => {
  it('is a full exemption up to $600,000', () => {
    const outcome = firstHomeDuty({ state: 'WA' as DutyState, propertyPrice: 600_000 })
    expect(outcome.payable).toBe(0)
    expect(outcome.saving).toBe(outcome.standard)
  })

  /**
   * RevenueWA Circular 23 gives $16.15 per $100 above $600,000, contradicting
   * the fact sheet's $20.14. The arithmetic check is that FHOR duty meets the
   * general rate at the $800,000 cap: $16.15 x 2,000 = $32,300 against a general
   * rate of $32,315.50. The transposed $20.14 would produce $40,280 — a
   * "concession" costing $7,964 MORE than paying full duty.
   */
  it('uses $16.15 per $100, which meets the general rate at the $800,000 cap', () => {
    const outcome = firstHomeDuty({ state: 'WA' as DutyState, propertyPrice: 800_000 })
    expect(outcome.payable).toBe(32_300)
    expect(outcome.standard).toBe(32_315.5)
    expect(outcome.saving).toBeCloseTo(15.5, 2)
  })

  it('never charges more than the general rate', () => {
    for (let price = 600_000; price <= 800_000; price += 10_000) {
      const outcome = firstHomeDuty({ state: 'WA' as DutyState, propertyPrice: price })
      expect(outcome.payable as number, `at $${price}`).toBeLessThanOrEqual(outcome.standard)
    }
  })

  it('gives no benefit at $800,000 and above', () => {
    const outcome = firstHomeDuty({ state: 'WA' as DutyState, propertyPrice: 850_000 })
    expect(outcome.payable).toBe(outcome.standard)
    expect(outcome.saving).toBe(0)
  })
})

describe('firstHomeDuty — cross-jurisdiction invariants', () => {
  /**
   * The single most important property of the whole module: a first home
   * benefit must never leave the buyer worse off than having no benefit at all.
   */
  it('never makes a first home buyer worse off, in any state at any price', () => {
    for (const state of ALL_STATES) {
      for (let price = 100_000; price <= 1_600_000; price += 25_000) {
        const outcome = firstHomeDuty({ state: state as DutyState, propertyPrice: price })
        if (!outcome.calculable) continue
        expect(outcome.payable as number, `${state} at $${price}`).toBeLessThanOrEqual(
          outcome.standard,
        )
        expect(outcome.saving as number, `${state} at $${price}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('keeps saving === standard − payable wherever it is calculable', () => {
    for (const state of ALL_STATES) {
      for (let price = 150_000; price <= 1_200_000; price += 75_000) {
        const outcome = firstHomeDuty({ state: state as DutyState, propertyPrice: price })
        if (!outcome.calculable) continue
        expect(outcome.saving as number, `${state} at $${price}`).toBeCloseTo(
          outcome.standard - (outcome.payable as number),
          2,
        )
      }
    }
  })

  it('echoes back the state and price it was asked about', () => {
    const outcome = firstHomeDuty({ state: 'VIC' as DutyState, propertyPrice: 640_000 })
    expect(outcome.state).toBe('VIC')
    expect(outcome.price).toBe(640_000)
  })

  it('always explains itself', () => {
    for (const state of ALL_STATES) {
      expect(firstHomeDuty({ state: state as DutyState, propertyPrice: 650_000 }).note.length).toBeGreaterThan(10)
    }
  })
})

describe('supportsDuty', () => {
  it.each(ALL_STATES)('recognises %s', (state) => {
    expect(supportsDuty(state)).toBe(true)
  })

  it('rejects TAS, which has no schedule implemented', () => {
    expect(supportsDuty('TAS')).toBe(false)
  })

  it.each(['', 'nsw', 'QQ', 'AUSTRALIA'])('rejects %o', (value) => {
    expect(supportsDuty(value)).toBe(false)
  })
})

describe('formatDuty', () => {
  it('omits cents when there are none', () => {
    expect(formatDuty(30_187)).toBe('30,187')
  })

  it('keeps cents when there are some', () => {
    expect(formatDuty(29_740.5)).toBe('29,740.50')
    expect(formatDuty(4.5)).toBe('4.50')
  })

  it('formats zero without decimals', () => {
    expect(formatDuty(0)).toBe('0')
  })
})

describe('firstHomeDuty — Land + Build Vacant Land Boundary Tests', () => {
  it('NSW: Full exemption at exactly $350k, taper at $400k, full duty at exactly $450k', () => {
    let outcome = firstHomeDuty({ state: 'NSW', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 350_000 })
    expect(outcome.payable).toBe(0)
    
    outcome = firstHomeDuty({ state: 'NSW', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 450_000 })
    expect(outcome.payable).toBe(standardDuty('NSW', 450_000))

    outcome = firstHomeDuty({ state: 'NSW', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 400_000 })
    expect(outcome.calculable).toBe(false)
    expect(outcome.note).toMatch(/FHBAS calculator/i)
  })

  it('VIC: Full exemption at exactly $600k, full duty at exactly $750k', () => {
    let outcome = firstHomeDuty({ state: 'VIC', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 600_000 })
    expect(outcome.payable).toBe(0)
    
    outcome = firstHomeDuty({ state: 'VIC', propertyPrice: 900_000, propertyCategory: 'land', landPrice: 750_000 })
    expect(outcome.payable).toBe(standardDuty('VIC', 750_000))
    
    outcome = firstHomeDuty({ state: 'VIC', propertyPrice: 900_000, propertyCategory: 'land', landPrice: 675_000 })
    expect(outcome.payable).toBe(Math.round(standardDuty('VIC', 675_000) * 0.5))
  })

  it('WA: Full exemption at exactly $450k, full duty at exactly $550k', () => {
    let outcome = firstHomeDuty({ state: 'WA', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 450_000 })
    expect(outcome.payable).toBe(0)
    
    outcome = firstHomeDuty({ state: 'WA', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 550_000 })
    expect(outcome.payable).toBe(standardDuty('WA', 550_000))
    
    outcome = firstHomeDuty({ state: 'WA', propertyPrice: 800_000, propertyCategory: 'land', landPrice: 500_000 })
    const hundreds = Math.ceil((500_000 - 450_000) / 100)
    expect(outcome.payable).toBe(Math.min(Math.round(20.14 * hundreds), standardDuty('WA', 500_000)))
  })

  it('QLD: No value cap for vacant land (full exemption for any land price)', () => {
    let outcome = firstHomeDuty({ state: 'QLD', propertyPrice: 600_000, propertyCategory: 'land', landPrice: 400_000 })
    expect(outcome.payable).toBe(0)
    
    outcome = firstHomeDuty({ state: 'QLD', propertyPrice: 2_000_000, propertyCategory: 'land', landPrice: 1_000_000 })
    expect(outcome.payable).toBe(0)
  })

  it('SA, ACT, NT: standard duty is correctly calculated on landPrice, not propertyPrice', () => {
    for (const state of ['SA', 'ACT', 'NT'] as DutyState[]) {
      const outcome = firstHomeDuty({ state, propertyPrice: 800_000, propertyCategory: 'land', landPrice: 400_000 })
      expect(outcome.payable).toBe(0)
      expect(outcome.saving).toBe(standardDuty(state, 400_000))
      expect(outcome.standard).toBe(standardDuty(state, 400_000))
    }
  })
})
