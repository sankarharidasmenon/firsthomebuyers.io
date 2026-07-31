import { describe, it, expect } from 'vitest'
import {
  calculateGrants,
  type CalculatorInput,
  type CalculatorScheme,
} from '@/lib/calculator/grantCalculator'

/**
 * The calculator decides which schemes a user is shown and what dollar total is
 * promised. Its filters are string-matching over hand-maintained master data,
 * so the edge cases below are the realistic failure modes: a state code
 * matching inside another state's name, an inclusive vs exclusive price cap,
 * and a closed scheme still sitting in the table.
 */

function scheme(overrides: Partial<CalculatorScheme> = {}): CalculatorScheme {
  return {
    scheme_id: 'test-scheme',
    scheme_name: 'Test Scheme',
    type: 'Grant',
    benefit_value: '$10,000',
    status: 'Open',
    official_url: 'https://example.gov.au',
    applicable_states: 'NSW',
    eligible_property_types: 'New home; Established home',
    ...overrides,
  }
}

const input = (overrides: Partial<CalculatorInput> = {}): CalculatorInput => ({
  state: 'NSW',
  propertyType: 'house',
  propertyPrice: 650_000,
  ...overrides,
})

describe('calculateGrants — scheme status', () => {
  it.each(['Closed', 'closed', 'Ended', 'Expired', 'Merged', 'Superseded', 'Inactive'])(
    'excludes a scheme marked %s',
    (status) => {
      const result = calculateGrants([scheme({ status })], input())
      expect(result.grants).toHaveLength(0)
      expect(result.schemes).toHaveLength(0)
    },
  )

  it('includes an open scheme', () => {
    const result = calculateGrants([scheme()], input())
    expect(result.grants).toHaveLength(1)
  })
})

describe('calculateGrants — state availability', () => {
  it('matches on the state code', () => {
    expect(calculateGrants([scheme({ applicable_states: 'NSW' })], input()).grants).toHaveLength(1)
  })

  it('matches on the full state name', () => {
    const result = calculateGrants([scheme({ applicable_states: 'NEW SOUTH WALES' })], input())
    expect(result.grants).toHaveLength(1)
  })

  it.each(['All States', 'All Territories', 'Nation-wide', 'Australia-wide'])(
    'treats %s as available everywhere',
    (states) => {
      const result = calculateGrants([scheme({ applicable_states: states })], input({ state: 'TAS' }))
      expect(result.grants).toHaveLength(1)
    },
  )

  it('treats an empty state list as available everywhere', () => {
    const result = calculateGrants([scheme({ applicable_states: '' })], input({ state: 'QLD' }))
    expect(result.grants).toHaveLength(1)
  })

  it('excludes a scheme for a different state', () => {
    const result = calculateGrants([scheme({ applicable_states: 'VIC' })], input({ state: 'NSW' }))
    expect(result.grants).toHaveLength(0)
  })

  /**
   * The word-boundary guard exists so "WA" cannot match the "WA" inside
   * "NEW SOUTH WALES". Without it, every WA applicant would be offered NSW
   * schemes.
   */
  it('does not match WA inside "NEW SOUTH WALES"', () => {
    const result = calculateGrants(
      [scheme({ applicable_states: 'NEW SOUTH WALES' })],
      input({ state: 'WA' }),
    )
    expect(result.grants).toHaveLength(0)
  })
})

describe('calculateGrants — property type', () => {
  it('excludes a new-build-only scheme for an existing house', () => {
    const result = calculateGrants(
      [scheme({ eligible_property_types: 'New home; Off-the-plan' })],
      input({ propertyType: 'house' }),
    )
    expect(result.grants).toHaveLength(0)
  })

  it('includes an established-home scheme for an existing house', () => {
    const result = calculateGrants(
      [scheme({ eligible_property_types: 'Established home' })],
      input({ propertyType: 'house' }),
    )
    expect(result.grants).toHaveLength(1)
  })

  it('honours new_vs_established as the authoritative restriction', () => {
    const result = calculateGrants(
      [
        scheme({
          eligible_property_types: 'New home; Established home',
          new_vs_established: 'New homes only',
        }),
      ],
      input({ propertyType: 'house' }),
    )
    expect(result.grants).toHaveLength(0)
  })

  it('matches an apartment against unit/flat wording', () => {
    const result = calculateGrants(
      [scheme({ eligible_property_types: 'Apartment/Unit' })],
      input({ propertyType: 'apartment' }),
    )
    expect(result.grants).toHaveLength(1)
  })

  it('excludes a land-only programme, which the calculator cannot offer', () => {
    const result = calculateGrants(
      [scheme({ eligible_property_types: 'Vacant land; House and land' })],
      input({ propertyType: 'house' }),
    )
    expect(result.grants).toHaveLength(0)
  })

  it('always includes a scheme that is not property-shaped at all', () => {
    // FHSS has no eligible_property_types — it is about superannuation, not
    // dwellings — so the property filter must never exclude it.
    const fhss = scheme({
      scheme_id: 'fhss',
      type: 'Scheme',
      eligible_property_types: '',
      benefit_value: 'Up to $50,000',
    })
    for (const propertyType of ['house', 'townhouse', 'apartment', 'offplan'] as const) {
      const result = calculateGrants([fhss], input({ propertyType }))
      expect(result.schemes.map((s) => s.id), propertyType).toEqual(['fhss'])
    }
  })
})

describe('calculateGrants — price caps', () => {
  it('includes a property at exactly the cap by default', () => {
    const result = calculateGrants(
      [scheme({ property_price_cap: '$650,000' })],
      input({ propertyPrice: 650_000 }),
    )
    expect(result.grants).toHaveLength(1)
  })

  it('excludes a property above the cap', () => {
    const result = calculateGrants(
      [scheme({ property_price_cap: '$650,000' })],
      input({ propertyPrice: 650_001 }),
    )
    expect(result.grants).toHaveLength(0)
  })

  /** QLD FHOG says "less than $750,000", which excludes the cap itself. */
  it('excludes the cap value itself when the wording says "less than"', () => {
    const result = calculateGrants(
      [scheme({ property_price_cap: 'Less than $750,000' })],
      input({ propertyPrice: 750_000 }),
    )
    expect(result.grants).toHaveLength(0)
  })

  it('uses the most generous cap when a state publishes several', () => {
    const result = calculateGrants(
      [
        scheme({
          price_cap_variations: 'NSW: $1,500,000 (Sydney) | $800,000 (rest of NSW)',
          property_price_cap: '$800,000',
        }),
      ],
      input({ propertyPrice: 1_200_000 }),
    )
    expect(result.grants).toHaveLength(1)
  })

  it('applies no cap when none is published', () => {
    const result = calculateGrants(
      [scheme({ property_price_cap: null })],
      input({ propertyPrice: 5_000_000 }),
    )
    expect(result.grants).toHaveLength(1)
  })

  it('ignores caps entirely when no price has been entered', () => {
    const result = calculateGrants(
      [scheme({ property_price_cap: '$500,000' })],
      input({ propertyPrice: 0 }),
    )
    expect(result.grants).toHaveLength(1)
  })
})

describe('calculateGrants — classification and totals', () => {
  it('splits fixed cash grants from non-cash schemes', () => {
    const result = calculateGrants(
      [
        scheme({ scheme_id: 'fhog', type: 'Grant', benefit_value: '$10,000' }),
        scheme({ scheme_id: 'fhbg', type: 'Scheme', benefit_value: 'LMI waived' }),
      ],
      input(),
    )
    expect(result.grants.map((g) => g.id)).toEqual(['fhog'])
    expect(result.schemes.map((s) => s.id)).toEqual(['fhbg'])
    expect(result.grants[0].value).toBe(10_000)
    expect(result.schemes[0].value).toBe('LMI waived')
  })

  it('sums only the cash grants into cashGrantsTotal', () => {
    const result = calculateGrants(
      [
        scheme({ scheme_id: 'a', benefit_value: '$10,000' }),
        scheme({ scheme_id: 'b', benefit_value: '$15,000' }),
        scheme({ scheme_id: 'c', type: 'Scheme', benefit_value: 'LMI waived' }),
      ],
      input(),
    )
    expect(result.cashGrantsTotal).toBe(25_000)
  })

  it('orders duty concessions ahead of other schemes', () => {
    const result = calculateGrants(
      [
        scheme({ scheme_id: 'other', type: 'Scheme', benefit_value: 'Shared equity' }),
        scheme({ scheme_id: 'duty', type: 'Stamp duty concession', benefit_value: 'Exemption' }),
      ],
      input(),
    )
    expect(result.schemes[0].id).toBe('duty')
  })

  it('falls back to a readable name when the scheme is unnamed', () => {
    const result = calculateGrants(
      [scheme({ scheme_name: null, type: 'Scheme', benefit_value: 'Something' })],
      input(),
    )
    expect(result.schemes[0].name).toBe('Government Scheme')
  })
})

describe('calculateGrants — stamp duty integration', () => {
  it('attaches a duty outcome for a supported state', () => {
    const result = calculateGrants([], input({ state: 'VIC', propertyPrice: 600_000 }))
    expect(result.duty).not.toBeNull()
    expect(result.duty?.state).toBe('VIC')
    expect(result.stampDutySaving).toBeGreaterThan(0)
  })

  it('returns no duty outcome for TAS, which has no schedule', () => {
    const result = calculateGrants([], input({ state: 'TAS' }))
    expect(result.duty).toBeNull()
    expect(result.stampDutySaving).toBe(0)
  })

  it('returns no duty outcome without a price', () => {
    const result = calculateGrants([], input({ propertyPrice: 0 }))
    expect(result.duty).toBeNull()
  })

  it('counts no saving when duty is not calculable', () => {
    // NSW $800,001-$999,999 is the documented not-calculable band.
    const result = calculateGrants([], input({ state: 'NSW', propertyPrice: 900_000 }))
    expect(result.duty?.calculable).toBe(false)
    expect(result.stampDutySaving).toBe(0)
  })

  it('totals cash grants plus duty saving', () => {
    const result = calculateGrants(
      [scheme({ benefit_value: '$10,000' })],
      input({ state: 'VIC', propertyPrice: 600_000 }),
    )
    expect(result.totalValue).toBe(result.cashGrantsTotal + result.stampDutySaving)
    expect(result.totalValue).toBeGreaterThan(10_000)
  })
})

describe('calculateGrants — purity', () => {
  it('does not mutate the schemes it is given', () => {
    const schemes = [scheme({ scheme_id: 'a' }), scheme({ scheme_id: 'b', status: 'Closed' })]
    const snapshot = JSON.parse(JSON.stringify(schemes)) as CalculatorScheme[]
    calculateGrants(schemes, input())
    expect(schemes).toEqual(snapshot)
  })

  it('returns the same result for the same inputs', () => {
    const schemes = [scheme()]
    expect(calculateGrants(schemes, input())).toEqual(calculateGrants(schemes, input()))
  })

  it('handles an empty scheme table', () => {
    const result = calculateGrants([], input())
    expect(result.grants).toEqual([])
    expect(result.schemes).toEqual([])
    expect(result.cashGrantsTotal).toBe(0)
  })
})
