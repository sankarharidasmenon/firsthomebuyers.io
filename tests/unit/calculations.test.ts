import { describe, it, expect } from 'vitest'
import {
  calculateBorrowingCapacity,
  calculateRepayments,
  calculateDepositGap,
  formatCurrency,
  formatNumber,
  type BorrowingInputs,
} from '@/lib/calculations'

/**
 * Borrowing capacity is the headline figure on the results page. These tests
 * pin the serviceability model's documented behaviour — the APRA buffer, the
 * HEM expense floor, the 3.8% credit-card assessment and the HECS reduction —
 * so a refactor cannot silently move the number a user sees.
 */

/** A solvent single applicant; individual tests override one field at a time. */
function baseInputs(overrides: Partial<BorrowingInputs> = {}): BorrowingInputs {
  return {
    annualIncome: 85_000,
    partnerIncome: 0,
    monthlyExpenses: 3_200,
    creditCardLimit: 0,
    otherLoanRepayments: 0,
    hecsDebt: false,
    depositAmount: 65_000,
    employmentType: 'fulltime',
    ...overrides,
  }
}

describe('calculateBorrowingCapacity — shape and guards', () => {
  it('returns a range where min is 90% of max, both rounded to $1,000', () => {
    const { min, max } = calculateBorrowingCapacity(baseInputs())
    expect(max).toBeGreaterThan(0)
    expect(min).toBeLessThan(max)
    expect(min % 1000).toBe(0)
    expect(max % 1000).toBe(0)
    // min is derived from max's pre-rounding value, so allow one rounding step.
    expect(Math.abs(min - max * 0.9)).toBeLessThanOrEqual(1000)
  })

  it('never returns a negative capacity when expenses exceed income', () => {
    const result = calculateBorrowingCapacity(
      baseInputs({ annualIncome: 30_000, monthlyExpenses: 9_000 }),
    )
    expect(result.min).toBe(0)
    expect(result.max).toBe(0)
  })

  it('returns zero for zero income', () => {
    const result = calculateBorrowingCapacity(baseInputs({ annualIncome: 0 }))
    expect(result).toEqual({ min: 0, max: 0 })
  })

  it('treats a missing partner income as zero rather than NaN', () => {
    const result = calculateBorrowingCapacity(
      baseInputs({ partnerIncome: undefined as unknown as number }),
    )
    expect(Number.isFinite(result.max)).toBe(true)
    expect(result.max).toBeGreaterThan(0)
  })
})

describe('calculateBorrowingCapacity — the HEM expense floor', () => {
  /**
   * Banks assess against a Household Expenditure Measure floor, so declaring
   * implausibly low expenses must NOT inflate borrowing power.
   */
  it('ignores declared expenses below the $3,200 single floor', () => {
    const declaredLow = calculateBorrowingCapacity(baseInputs({ monthlyExpenses: 500 }))
    const atFloor = calculateBorrowingCapacity(baseInputs({ monthlyExpenses: 3_200 }))
    expect(declaredLow).toEqual(atFloor)
  })

  it('uses declared expenses once they exceed the floor', () => {
    const atFloor = calculateBorrowingCapacity(baseInputs({ monthlyExpenses: 3_200 }))
    const aboveFloor = calculateBorrowingCapacity(baseInputs({ monthlyExpenses: 5_000 }))
    expect(aboveFloor.max).toBeLessThan(atFloor.max)
  })

  it('raises the floor to $4,500 when there is a partner', () => {
    // Same total household income, but a couple is assessed against the higher
    // floor, so the couple can borrow less than the single earner.
    const single = calculateBorrowingCapacity(
      baseInputs({ annualIncome: 170_000, partnerIncome: 0, monthlyExpenses: 1_000 }),
    )
    const couple = calculateBorrowingCapacity(
      baseInputs({ annualIncome: 85_000, partnerIncome: 85_000, monthlyExpenses: 1_000 }),
    )
    expect(couple.max).toBeLessThan(single.max)
  })
})

describe('calculateBorrowingCapacity — commitments', () => {
  it('reduces capacity as the credit card limit rises, even at a zero balance', () => {
    const noCard = calculateBorrowingCapacity(baseInputs({ creditCardLimit: 0 }))
    const withCard = calculateBorrowingCapacity(baseInputs({ creditCardLimit: 20_000 }))
    expect(withCard.max).toBeLessThan(noCard.max)
  })

  it('reduces capacity for a HECS debt', () => {
    const without = calculateBorrowingCapacity(baseInputs({ hecsDebt: false }))
    const withHecs = calculateBorrowingCapacity(baseInputs({ hecsDebt: true }))
    expect(withHecs.max).toBeLessThan(without.max)
  })

  it('reduces capacity for other loan repayments', () => {
    const without = calculateBorrowingCapacity(baseInputs({ otherLoanRepayments: 0 }))
    const withLoan = calculateBorrowingCapacity(baseInputs({ otherLoanRepayments: 800 }))
    expect(withLoan.max).toBeLessThan(without.max)
  })

  it('increases capacity as income rises', () => {
    const lower = calculateBorrowingCapacity(baseInputs({ annualIncome: 85_000 }))
    const higher = calculateBorrowingCapacity(baseInputs({ annualIncome: 120_000 }))
    expect(higher.max).toBeGreaterThan(lower.max)
  })

  it('adds partner income to household capacity', () => {
    const solo = calculateBorrowingCapacity(baseInputs({ partnerIncome: 0 }))
    const joint = calculateBorrowingCapacity(baseInputs({ partnerIncome: 70_000 }))
    expect(joint.max).toBeGreaterThan(solo.max)
  })
})

describe('calculateBorrowingCapacity — regression pin', () => {
  /**
   * The documented sample applicant. Pinning the exact output means any change
   * to the assessment rate, HEM floor or commitment weightings shows up as a
   * failing test rather than a silently different number on the results page.
   *
   * Derivation at 85k income, 3,200 expenses, 5k card limit, HECS:
   *   monthly income     85,000 / 12          = 7,083.33
   *   assessment rate    (0.065 + 0.03) / 12  = 0.00791667
   *   card commitment    5,000 x 0.038 / 12   =    15.83
   *   HECS reduction     7,083.33 x 0.07      =   495.83
   *   net monthly        7,083.33 - 3,200 - 15.83 - 495.83 = 3,371.67
   *   capacity           3,371.67 / 0.00791667 = 425,894.74
   */
  it('matches the documented sample applicant', () => {
    const result = calculateBorrowingCapacity(
      baseInputs({ creditCardLimit: 5_000, hecsDebt: true }),
    )
    expect(result).toEqual({ min: 383_000, max: 426_000 })
  })
})

describe('calculateRepayments', () => {
  it('amortises a 30-year loan at the default 6.5%', () => {
    const { monthly } = calculateRepayments(500_000)
    // Standard amortisation of $500,000 over 360 months at 6.5% p.a.
    expect(monthly).toBeGreaterThan(3_100)
    expect(monthly).toBeLessThan(3_200)
  })

  it('derives fortnightly from the monthly figure', () => {
    const { monthly, fortnightly } = calculateRepayments(500_000)
    // Fortnightly is derived from the UNROUNDED monthly repayment, so
    // re-deriving it from the rounded return value can differ by a dollar.
    expect(fortnightly).toBeCloseTo((monthly * 12) / 26, -0.5)
    expect(Math.abs(fortnightly - Math.round((monthly * 12) / 26))).toBeLessThanOrEqual(1)
    expect(fortnightly).toBeLessThan(monthly)
  })

  it('scales linearly with the loan amount', () => {
    const single = calculateRepayments(300_000).monthly
    const double = calculateRepayments(600_000).monthly
    expect(double).toBeCloseTo(single * 2, 0)
  })

  it('charges more at a higher rate', () => {
    const cheap = calculateRepayments(500_000, 0.05).monthly
    const dear = calculateRepayments(500_000, 0.08).monthly
    expect(dear).toBeGreaterThan(cheap)
  })

  it('returns whole dollars', () => {
    const { monthly, fortnightly } = calculateRepayments(437_500)
    expect(Number.isInteger(monthly)).toBe(true)
    expect(Number.isInteger(fortnightly)).toBe(true)
  })
})

describe('calculateDepositGap', () => {
  it('reports the shortfall to a 20% deposit', () => {
    const result = calculateDepositGap(65_000, 650_000)
    expect(result.gap).toBe(65_000)
    expect(result.depositPercent).toBe(10)
    expect(result.needsLMI).toBe(true)
  })

  it('clears LMI exactly at 20%', () => {
    const result = calculateDepositGap(130_000, 650_000)
    expect(result.gap).toBe(0)
    expect(result.depositPercent).toBe(20)
    expect(result.needsLMI).toBe(false)
  })

  it('never reports a negative gap when the deposit exceeds 20%', () => {
    const result = calculateDepositGap(300_000, 650_000)
    expect(result.gap).toBe(0)
    expect(result.needsLMI).toBe(false)
    expect(result.depositPercent).toBeGreaterThan(20)
  })

  it('treats a zero deposit as the full 20% gap', () => {
    const result = calculateDepositGap(0, 500_000)
    expect(result.gap).toBe(100_000)
    expect(result.depositPercent).toBe(0)
    expect(result.needsLMI).toBe(true)
  })
})

describe('currency and number formatting', () => {
  /** Intl can emit non-breaking spaces; normalise before comparing. */
  const normalise = (value: string) => value.replace(/ /g, ' ')

  it('formats whole dollars in en-AU with no cents', () => {
    expect(normalise(formatCurrency(650_000))).toBe('$650,000')
  })

  it('rounds away cents', () => {
    expect(normalise(formatCurrency(1234.56))).toBe('$1,235')
  })

  it('formats zero', () => {
    expect(normalise(formatCurrency(0))).toBe('$0')
  })

  it('groups plain numbers with thousands separators', () => {
    expect(normalise(formatNumber(1_234_567))).toBe('1,234,567')
  })
})
