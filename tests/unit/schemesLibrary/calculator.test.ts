import { describe, it, expect } from 'vitest'
import { calculateSchemesLibrary } from '@/lib/schemesLibrary/calculator'

/**
 * Pinned to real rows in the Grants & Schemes Library (RulesEngine/Sept'26/
 * fhb_grants_schemes_library.db → src/lib/schemesLibrary/data.ts), verified
 * by direct query before writing these — see NSW_FHOG and FED_HTB's actual
 * price_caps/income_caps rows in session notes. If a fixture value here
 * stops matching the generated data.ts, that's the data changing underneath
 * the test (rerun scripts/gen-schemes-library-data.mjs changed something),
 * not a reason to "fix" the assertion to match.
 */

function baseInput(overrides: Partial<Parameters<typeof calculateSchemesLibrary>[0]> = {}) {
  return {
    state: 'NSW',
    propertyType: 'established' as const,
    propertyPrice: 700_000,
    buyingWithPartner: false,
    everOwnedProperty: false,
    citizenshipStatus: 'citizen' as const,
    willLiveIn: true,
    ...overrides,
  }
}

function find(result: ReturnType<typeof calculateSchemesLibrary>, schemeId: string) {
  const m = result.matches.find((x) => x.scheme.scheme_id === schemeId)
  if (!m) throw new Error(`Expected ${schemeId} to be a candidate but it was filtered out entirely`)
  return m
}

describe('calculateSchemesLibrary — jurisdiction scoping', () => {
  it('only includes Federal schemes and the selected state', () => {
    const result = calculateSchemesLibrary(baseInput({ state: 'NSW' }))
    const jurisdictions = new Set(result.matches.map((m) => m.scheme.jurisdiction))
    expect(jurisdictions.has('NSW')).toBe(true)
    expect(jurisdictions.has('Federal')).toBe(true)
    expect(jurisdictions.has('VIC')).toBe(false)
    expect(jurisdictions.has('QLD')).toBe(false)
  })

  it('excludes Closed schemes (e.g. ACT_NO_FHOG) even when the jurisdiction matches', () => {
    const result = calculateSchemesLibrary(baseInput({ state: 'ACT' }))
    expect(result.matches.some((m) => m.scheme.scheme_id === 'ACT_NO_FHOG')).toBe(false)
  })

  it('is empty of state-specific schemes for a state with no library entry (still gets Federal)', () => {
    // Every SCHEMES jurisdiction other than Federal is one of the 8 states/territories,
    // so this just pins that Federal schemes always appear regardless of state input.
    const result = calculateSchemesLibrary(baseInput({ state: 'NSW' }))
    expect(result.matches.some((m) => m.scheme.jurisdiction === 'Federal')).toBe(true)
  })
})

describe('calculateSchemesLibrary — property type (NSW_FHOG: New_or_Substantially_Renovated only)', () => {
  it('an established home is ineligible for a new-home-only grant', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'established', propertyPrice: 500_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.status).toBe('ineligible')
    expect(m.reasons.some((r) => /Not available for/.test(r))).toBe(true)
  })

  it('a new home passes the property-type test', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 500_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.status).toBe('eligible')
  })
})

describe('calculateSchemesLibrary — price caps (NSW_FHOG: $600k new-home-purchase / $750k house-and-land)', () => {
  it('price at or below the lowest relevant cap is a clean pass', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 550_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.priceCap.status).toBe('within')
    expect(m.status).toBe('eligible')
  })

  // propertyType now resolves NSW_FHOG's two bands cleanly instead of
  // blending them into one ambiguous range: a plain new-home purchase only
  // ever sees the $600k band, so $700k is a hard 'over' — it must NOT read
  // as a "check" just because a *different* band (house-and-land) happens to
  // cover that price. Buying land to build on picks up that $750k band
  // instead, correctly passing at the same $700k price.
  it('a plain new-home purchase between the two bands is over the $600k cap that actually applies to it', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 700_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.priceCap.status).toBe('over')
    expect(m.status).toBe('ineligible')
  })

  it('the same price passes under the $750k house-and-land band once propertyType is vacant_land', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'vacant_land', propertyPrice: 700_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.priceCap.status).toBe('within')
    expect(m.status).toBe('eligible')
  })

  it('price above every relevant cap is ineligible', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 900_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.priceCap.status).toBe('over')
    expect(m.status).toBe('ineligible')
  })

  it('a scheme with no price cap rows is never failed or flagged for price', () => {
    // An absurdly high price isolates schemes with priceCap.status 'none' (no
    // cap recorded at all) from ones that would genuinely fail a real cap.
    const result = calculateSchemesLibrary(baseInput({ state: 'NT', propertyType: 'new', propertyPrice: 50_000_000 }))
    const uncapped = result.matches.filter((m) => m.priceCap.status === 'none')
    expect(uncapped.length).toBeGreaterThan(0)
    for (const m of uncapped) {
      expect(m.reasons.some((r) => /cap/i.test(r))).toBe(false)
    }
  })
})

describe('calculateSchemesLibrary — income caps (FED_HTB: $103k single / $165k joint)', () => {
  it('no income supplied downgrades to "check", never a silent pass or fail', () => {
    const result = calculateSchemesLibrary(baseInput({ income: undefined }))
    const m = find(result, 'FED_HTB')
    expect(m.incomeCap.status).toBe('check')
  })

  it('single income over the $103k single cap is ineligible', () => {
    const result = calculateSchemesLibrary(baseInput({ buyingWithPartner: false, income: 110_000, propertyType: 'new', propertyPrice: 500_000 }))
    const m = find(result, 'FED_HTB')
    expect(m.incomeCap.applicantType).toBe('Single')
    expect(m.incomeCap.status).toBe('over')
    expect(m.status).toBe('ineligible')
  })

  it('the same income is fine once buying jointly, under the $165k joint cap', () => {
    const result = calculateSchemesLibrary(baseInput({ buyingWithPartner: true, income: 110_000, propertyType: 'new', propertyPrice: 500_000 }))
    const m = find(result, 'FED_HTB')
    expect(m.incomeCap.applicantType).toBe('Joint')
    expect(m.incomeCap.status).toBe('within')
  })
})

describe('calculateSchemesLibrary — result shape and totals', () => {
  it('sorts eligible before check before ineligible', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'established', propertyPrice: 700_000 }))
    const rank: Record<string, number> = { eligible: 0, check: 1, ineligible: 2 }
    const ranks = result.matches.map((m) => rank[m.status])
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1])
    }
    // Sanity: this input actually produces more than one status, or the
    // monotonicity check above would be vacuously true.
    expect(new Set(ranks).size).toBeGreaterThan(1)
  })

  it('cashGrantsTotal only sums eligible, cash-grant-type schemes', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 500_000 }))
    const manualTotal = result.matches
      .filter((m) => m.status === 'eligible' && m.scheme.scheme_type === 'Grant')
      .reduce((sum, m) => sum + (m.scheme.grant_amount_dollars ?? 0), 0)
    expect(result.cashGrantsTotal).toBe(manualTotal)
    expect(result.eligibleCount).toBe(result.matches.filter((m) => m.status === 'eligible').length)
  })

  it('every match carries its free-text eligibility criteria for self-verification', () => {
    const result = calculateSchemesLibrary(baseInput())
    const withCriteria = result.matches.filter((m) => m.toVerify.length > 0)
    expect(withCriteria.length).toBeGreaterThan(0)
    for (const m of withCriteria) {
      for (const item of m.toVerify) {
        expect(typeof item.text).toBe('string')
        expect(item.text.length).toBeGreaterThan(0)
        expect(typeof item.mandatory).toBe('boolean')
      }
    }
  })
})

describe('calculateSchemesLibrary — purchasing entity (NSW_FHOG requires a natural person)', () => {
  it('defaults to individual and passes when unspecified', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 500_000 }))
    const m = find(result, 'NSW_FHOG')
    expect(m.entity.status).toBe('pass')
  })

  it('fails when buying through a company or trust', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'new', propertyPrice: 500_000, purchasingEntity: 'company_or_trust' }))
    const m = find(result, 'NSW_FHOG')
    expect(m.entity.status).toBe('fail')
    expect(m.status).toBe('ineligible')
  })

  it('does not gate a scheme with no natural-person requirement (e.g. FED_FHSSS)', () => {
    const result = calculateSchemesLibrary(baseInput({ purchasingEntity: 'company_or_trust' }))
    const m = find(result, 'FED_FHSSS')
    expect(m.entity.status).toBe('none')
  })
})

describe('calculateSchemesLibrary — single parent (FED_HGS_FHG_FAMILY only)', () => {
  it('is ineligible by default — nothing else implies single-parent status', () => {
    const result = calculateSchemesLibrary(baseInput())
    const m = find(result, 'FED_HGS_FHG_FAMILY')
    expect(m.singleParent.status).toBe('fail')
    expect(m.status).toBe('ineligible')
  })

  it('passes once isSingleParent is true and not buying with a partner', () => {
    const result = calculateSchemesLibrary(baseInput({ isSingleParent: true, buyingWithPartner: false }))
    const m = find(result, 'FED_HGS_FHG_FAMILY')
    expect(m.singleParent.status).toBe('pass')
  })

  it('still fails a contradictory claim of single parent while buying with a partner', () => {
    const result = calculateSchemesLibrary(baseInput({ isSingleParent: true, buyingWithPartner: true }))
    const m = find(result, 'FED_HGS_FHG_FAMILY')
    expect(m.singleParent.status).toBe('fail')
  })

  it('does not gate the general First Home Guarantee', () => {
    const result = calculateSchemesLibrary(baseInput())
    const m = find(result, 'FED_HGS_FHG')
    expect(m.singleParent.status).toBe('none')
  })
})

describe('calculateSchemesLibrary — vacant land price-cap band (NSW_FHBAS: $800k/$1M house vs $350k/$450k land)', () => {
  it('a house purchase is checked against the house bands, unaffected by the lower land-only band', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'established', propertyPrice: 500_000 }))
    const m = find(result, 'NSW_FHBAS')
    expect(m.priceCap.status).toBe('within')
  })

  it('buying vacant land at the same price is checked against the land band instead, and fails it', () => {
    const result = calculateSchemesLibrary(baseInput({ propertyType: 'vacant_land', propertyPrice: 500_000 }))
    const m = find(result, 'NSW_FHBAS')
    expect(m.priceCap.status).toBe('over')
  })
})

describe('calculateSchemesLibrary — Federal untagged territory rows never leak into a mainland state (FED_HTB)', () => {
  // FED_HTB carries "Jervis_Bay_Norfolk" ($550k) and "Christmas_Cocos"
  // ($400k) rows that name no state at all — a regression let those leak
  // into every state's price-cap range, making a clean $1.3M NSW cap look
  // like an $400k-$1.3M ambiguous "check" band instead.
  it('resolves a clean pass under the $1.3M NSW capital-city cap, not a false "check" from an unrelated territory row', () => {
    const result = calculateSchemesLibrary(baseInput({ state: 'NSW', propertyType: 'new', propertyPrice: 1_200_000, locationType: 'capital_city' }))
    const m = find(result, 'FED_HTB')
    expect(m.priceCap.status).toBe('within')
    expect(m.priceCap.lowestRelevantCap).toBe(1_300_000)
  })
})
