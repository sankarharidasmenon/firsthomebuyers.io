import { describe, it, expect } from 'vitest'
import {
  resolvePurchaseCap,
  resolveStateCaps,
  resolveRegionCap,
  highestStateCap,
} from '@/lib/schemes/priceCaps'

/**
 * These functions parse free-text master-data strings maintained by hand in a
 * spreadsheet, so malformed input is expected rather than exceptional. Every
 * function must degrade to null/[] instead of throwing or returning a wrong
 * cap, because a wrong cap silently includes or excludes a scheme worth
 * thousands of dollars to the applicant.
 */

/** The exact format documented in the module header. */
const FEDERAL_VARIATIONS =
  'NSW: $1,500,000 (Sydney and regional centres) | $800,000 (rest of NSW); ' +
  'VIC: $950,000 (Melbourne and Geelong) | $650,000 (rest of VIC); ACT: $1,000,000'

describe('resolveStateCaps', () => {
  it('returns every cap published for the state, highest first', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'NSW')).toEqual([
      { amount: 1_500_000, label: 'Sydney and regional centres' },
      { amount: 800_000, label: 'rest of NSW' },
    ])
  })

  it('handles a state with a single uncapped-by-region figure', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'ACT')).toEqual([
      { amount: 1_000_000, label: '' },
    ])
  })

  it('is case-insensitive and tolerates punctuation in the state', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'vic')).toHaveLength(2)
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'V.I.C.')).toHaveLength(2)
  })

  it('returns [] for a state not listed in the table', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'QLD')).toEqual([])
  })

  it('returns [] for something that is not a state code', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'XYZ')).toEqual([])
    expect(resolveStateCaps(FEDERAL_VARIATIONS, 'AUSTRALIA')).toEqual([])
  })

  it.each([null, undefined, '', 0, false])('returns [] for empty variations (%o)', (value) => {
    expect(resolveStateCaps(value, 'NSW')).toEqual([])
  })

  it('returns [] when the state is missing', () => {
    expect(resolveStateCaps(FEDERAL_VARIATIONS, undefined)).toEqual([])
  })

  /**
   * Rows that describe property kinds rather than jurisdictions ("Homes: ...
   * Vacant land: ...") must not be mistaken for a per-state table — the caller
   * falls back to the single property_price_cap column instead.
   */
  it('ignores a non-state-prefixed table', () => {
    const propertyKindTable = 'Homes: $750,000; Vacant land: $450,000'
    expect(resolveStateCaps(propertyKindTable, 'NSW')).toEqual([])
  })

  it('skips zero and unparseable amounts', () => {
    expect(resolveStateCaps('NSW: $0 (nil) | $800,000 (rest)', 'NSW')).toEqual([
      { amount: 800_000, label: 'rest' },
    ])
  })

  it('sorts descending even when the source lists the lower cap first', () => {
    const caps = resolveStateCaps('NSW: $800,000 (rest of NSW) | $1,500,000 (Sydney)', 'NSW')
    expect(caps.map((c) => c.amount)).toEqual([1_500_000, 800_000])
  })
})

describe('highestStateCap', () => {
  it('returns the most generous cap for the state', () => {
    expect(highestStateCap(FEDERAL_VARIATIONS, 'NSW')).toBe(1_500_000)
    expect(highestStateCap(FEDERAL_VARIATIONS, 'VIC')).toBe(950_000)
  })

  it('returns null when the state publishes no table', () => {
    expect(highestStateCap(FEDERAL_VARIATIONS, 'QLD')).toBeNull()
    expect(highestStateCap(null, 'NSW')).toBeNull()
  })
})

describe('resolveRegionCap', () => {
  it('resolves a capital-city suburb to the higher cap', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'NSW', 'capital')).toEqual({
      amount: 1_500_000,
      label: 'Sydney and regional centres',
    })
  })

  it('resolves a listed regional centre to the higher cap too', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'NSW', 'regional-centre')?.amount).toBe(1_500_000)
  })

  it('resolves the rest of the state to the lower cap', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'NSW', 'rest')).toEqual({
      amount: 800_000,
      label: 'rest of NSW',
    })
  })

  /**
   * An unclassified suburb must return null so the caller keeps its two-cap
   * "check required" behaviour rather than guessing a single cap.
   */
  it('returns null when the region is unknown', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'NSW', undefined)).toBeNull()
  })

  it('returns null when the state publishes no per-state table', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'QLD', 'capital')).toBeNull()
  })

  it('collapses to the single cap when only one is published', () => {
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'ACT', 'capital')?.amount).toBe(1_000_000)
    expect(resolveRegionCap(FEDERAL_VARIATIONS, 'ACT', 'rest')?.amount).toBe(1_000_000)
  })
})

describe('resolvePurchaseCap', () => {
  /**
   * The NSW FHOG caps a completed new home at $600,000 but a house-and-land
   * build at $750,000, keyed by BUY:/BUILD: rather than by state code.
   */
  const purchaseVariations =
    'BUY: $600,000 (completed new home); BUILD: $750,000 (land plus construction)'

  it('selects the BUILD cap for a Land + Build purchase', () => {
    expect(resolvePurchaseCap(purchaseVariations, 'Land + Build')).toEqual({
      amount: 750_000,
      label: 'land plus construction',
    })
  })

  it('selects the BUY cap for every other property type', () => {
    for (const propertyType of ['House', 'Apartment', 'Townhouse', 'Off-the-plan']) {
      expect(resolvePurchaseCap(purchaseVariations, propertyType)?.amount).toBe(600_000)
    }
  })

  it('defaults to the BUY cap when the property type is missing', () => {
    expect(resolvePurchaseCap(purchaseVariations, undefined)?.amount).toBe(600_000)
  })

  it('returns null when the text holds no BUY/BUILD table', () => {
    expect(resolvePurchaseCap(FEDERAL_VARIATIONS, 'House')).toBeNull()
  })

  it.each([null, undefined, ''])('returns null for empty variations (%o)', (value) => {
    expect(resolvePurchaseCap(value, 'House')).toBeNull()
  })

  it('returns null when the matching key has no parseable amount', () => {
    expect(resolvePurchaseCap('BUY: not published', 'House')).toBeNull()
  })

  /**
   * The module notes that no state code spells BUY or BUILD, so the two formats
   * can never collide. This locks that assumption in.
   */
  it('does not confuse a BUY/BUILD table with a state table', () => {
    expect(resolveStateCaps(purchaseVariations, 'NSW')).toEqual([])
    expect(resolvePurchaseCap(FEDERAL_VARIATIONS, 'Land + Build')).toBeNull()
  })
})
