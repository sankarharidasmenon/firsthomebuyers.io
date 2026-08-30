import { describe, it, expect } from 'vitest'
import { evaluateScheme, type ApiScheme, type EligibilityAnswers } from '@/lib/schemes/eligibilityClient'

/**
 * Regression suite for the four Federal schemes, pinned to the field values
 * verified against the ATO/Housing Australia source documents in
 * RulesEngine/Federal/ (see session notes, 2026-08-29/30). Each scheme fixture
 * is a literal snapshot of the CORRECT master-data row content, independent of
 * whatever is currently live in Supabase — the master-data pipeline replaces
 * the whole table on every Excel re-upload, so these tests exist specifically
 * to catch a re-upload silently reverting one of these fixes.
 *
 * If a test here fails against a change to eligibilityClient.ts /
 * applicantRules.ts, that is a real behaviour change and should be reviewed
 * accordingly. If the LIVE Supabase row for one of these schemes no longer
 * matches its fixture below, that is data drift, not a code bug — reapply the
 * fix from the session history.
 */

const FHSS: ApiScheme = {
  scheme_id: 'fed-first-home-super-saver',
  scheme_name: 'First Home Super Saver Scheme',
  type: 'Tax Benefit',
  benefit_type: 'Tax Benefit',
  benefit_value: 'Withdraw up to $50,000 of voluntary super contributions',
  status: 'Active',
  applicable_states: 'All States & Territories',
  first_home_buyer_required: 'Yes',
  owner_occupier_required: 'Yes',
  citizenship_residency: '', // No citizenship/residency test — confirmed by the ATO fact sheet.
  minimum_age: '18 years',
  income_cap_single: '',
  income_cap_couple: '',
  property_price_cap: '',
  price_cap_variations: '',
  eligible_property_types: 'New home; Established home; Vacant land',
  new_vs_established: 'Both new and established',
  minimum_deposit: '',
  prior_ownership_rules: 'Must not have previously owned residential property in Australia',
  single_parent_required: '',
  official_url: 'https://firsthomebuyers.gov.au/first-home-super-saver-scheme',
}

const HELP_TO_BUY: ApiScheme = {
  scheme_id: 'fed-help-to-buy',
  scheme_name: 'Australian Government Help to Buy Scheme',
  type: 'Shared Equity',
  benefit_type: 'Shared Equity',
  benefit_value: 'Up to 30% equity contribution (existing homes) or up to 40% (new homes)',
  status: 'Active',
  applicable_states: 'All States & Territories',
  first_home_buyer_required: '',
  owner_occupier_required: 'Yes',
  citizenship_residency: 'Australian citizen', // No "at least one" qualifier — binds every applicant.
  minimum_age: '18 years',
  income_cap_single: '$103,000',
  income_cap_couple: '$165,000',
  property_price_cap: '$1,300,000',
  price_cap_variations:
    'NSW: $1,300,000 (Sydney, Central Coast, Coffs Harbour-Grafton, Illawarra, Mid-North Coast, Newcastle and Lake Macquarie, and Richmond-Tweed) | $800,000 (rest of NSW); ' +
    'VIC: $950,000 (Melbourne and Geelong) | $650,000 (rest of VIC); ' +
    'QLD: $1,000,000 (Brisbane, Gold Coast and Sunshine Coast) | $700,000 (rest of QLD); ' +
    'WA: $850,000 (Perth) | $600,000 (rest of WA); ' +
    'SA: $900,000 (Adelaide) | $500,000 (rest of SA); ' +
    'TAS: $700,000 (Hobart) | $550,000 (rest of TAS); ' +
    'ACT: $1,000,000; NT: $600,000',
  eligible_property_types: 'New home; Established home; Apartment/Unit; Townhouse; House; House and land; Vacant land (for construction)',
  new_vs_established: 'Both new and established',
  minimum_deposit: '2%',
  prior_ownership_rules:
    'Cannot own or beneficially own any property in Australia or overseas at time of application (a current-ownership test, not a lifetime first-home-buyer history test).',
  single_parent_required: '',
  official_url: 'https://firsthomebuyers.gov.au/australian-government-help-buy-scheme',
}

const FIVE_PERCENT_DEPOSIT: ApiScheme = {
  scheme_id: 'fed-5-percent-deposit-scheme',
  scheme_name: 'Australian Government 5% Deposit Scheme',
  type: 'Guarantee',
  benefit_type: 'Guarantee',
  benefit_value: 'Government guarantee (avoids LMI)',
  status: 'Active',
  applicable_states: 'All States & Territories',
  first_home_buyer_required: 'Yes',
  owner_occupier_required: 'Yes',
  citizenship_residency: 'Australian citizen or permanent resident',
  minimum_age: '18 years',
  income_cap_single: '',
  income_cap_couple: '',
  property_price_cap: '$1,500,000',
  price_cap_variations:
    'NSW: $1,500,000 (Sydney, Central Coast, Coffs Harbour-Grafton, Illawarra, Mid North Coast, Richmond-Tweed, and Newcastle and Lake Macquarie) | $800,000 (rest of NSW); ' +
    'VIC: $950,000 (Melbourne and Geelong) | $650,000 (rest of VIC); ' +
    'QLD: $1,000,000 (Brisbane, Gold Coast and Sunshine Coast) | $700,000 (rest of QLD); ' +
    'WA: $850,000 (Perth) | $600,000 (rest of WA); ' +
    'SA: $900,000 (Adelaide) | $500,000 (rest of SA); ' +
    'TAS: $700,000 (Hobart) | $550,000 (rest of TAS); ' +
    'ACT: $1,000,000; NT: $750,000 (Darwin) | $600,000 (rest of NT)',
  eligible_property_types: 'New home; Established home; Off-the-plan; House and land; Vacant land; Apartment/Unit; Townhouse; Substantially renovated',
  new_vs_established: 'Both new and established',
  minimum_deposit: '5%',
  // Deliberately does NOT mention spouse/partner — a known, documented limitation
  // (see notes_caveats on the live row): partner prior-ownership is not caught
  // for this scheme, unlike NSW FHBAS which explicitly states it.
  prior_ownership_rules: 'Must not have owned property in Australia in the last 10 years',
  single_parent_required: '',
  official_url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme',
}

const FAMILY_HOME_GUARANTEE: ApiScheme = {
  scheme_id: 'fed-family-home-guarantee',
  scheme_name: 'Australian Government 5% Deposit Scheme for Single Parents',
  type: 'Guarantee',
  benefit_type: 'Guarantee',
  benefit_value: 'Government guarantee up to 18% of Property Value (avoids LMI)',
  status: 'Active',
  applicable_states: 'All States & Territories',
  first_home_buyer_required: '',
  owner_occupier_required: 'Yes',
  citizenship_residency: 'Australian citizen or permanent resident at the Home Loan Date',
  minimum_age: '18 years',
  income_cap_single: '',
  income_cap_couple: '',
  property_price_cap: '$1,500,000',
  price_cap_variations:
    'NSW: $1,500,000 (Sydney, Central Coast, Coffs Harbour-Grafton, Illawarra, Mid North Coast, Richmond-Tweed, and Newcastle and Lake Macquarie) | $800,000 (rest of NSW); ' +
    'VIC: $950,000 (Melbourne and Geelong) | $650,000 (rest of VIC); ' +
    'QLD: $1,000,000 (Brisbane, Gold Coast and Sunshine Coast) | $700,000 (rest of QLD); ' +
    'WA: $850,000 (Perth) | $600,000 (rest of WA); ' +
    'SA: $900,000 (Adelaide) | $500,000 (rest of SA); ' +
    'TAS: $700,000 (Hobart) | $550,000 (rest of TAS); ' +
    'ACT: $1,000,000; NT: $750,000 (Darwin) | $600,000 (rest of NT)',
  eligible_property_types: 'Existing home; House and land package; Vacant land (for construction); Off-the-plan; Apartment/Unit; Townhouse; House',
  new_vs_established: 'Both new and established',
  minimum_deposit: '2%',
  prior_ownership_rules:
    'Must not hold a freehold interest in real property (including land), a lease of land of 50+ years, or a company title interest in land anywhere in Australia at settlement.',
  single_parent_required: 'Yes',
  official_url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme',
}

/** Answers that satisfy every generic rule; override per test. */
function answers(overrides: Partial<EligibilityAnswers> = {}, ra: Record<string, unknown> = {}): EligibilityAnswers {
  return {
    state: 'NSW',
    firstHomeBuyer: true,
    income: 90_000,
    hasPartner: false,
    propertyPrice: 700_000,
    deposit: 100_000,
    propertyType: 'house',
    rawAnswers: {
      is18: 'Yes',
      citizenship: 'Australian Citizen',
      everOwned: 'No',
      priorBenefit: 'No',
      ppr: 'Yes',
      moveIn: 'Yes',
      entity: 'Individual',
      propertyType: 'Established (Existing)',
      ...ra,
    },
    ...overrides,
  }
}

function evaluate(scheme: ApiScheme, a: EligibilityAnswers) {
  return evaluateScheme(scheme, a)
}

// ─────────────────────────────────────────────────────────────────────────
describe('Federal: First Home Super Saver Scheme (FHSS)', () => {
  it('1. eligible baseline — 18+, first-time buyer, owner-occupier, PR', () => {
    const r = evaluate(FHSS, answers({}, { citizenship: 'Permanent Resident' }))
    expect(r.bucket).toBe('yes')
  })

  it('2. under 18 fails', () => {
    const r = evaluate(FHSS, answers({}, { is18: 'No' }))
    expect(r.bucket).toBe('no')
  })

  it('3. previously owned property fails', () => {
    const r = evaluate(FHSS, answers({ firstHomeBuyer: false }, { everOwned: 'Yes' }))
    expect(r.bucket).toBe('no')
  })

  it('4. no income cap — a very high income still passes', () => {
    const r = evaluate(FHSS, answers({ income: 5_000_000 }))
    expect(r.bucket).toBe('yes')
  })

  it('5. no citizenship/residency test — a Permanent Resident passes', () => {
    const r = evaluate(FHSS, answers({}, { citizenship: 'Permanent Resident' }))
    expect(r.ruleResults.some((x) => /Citizenship.*satisfied/i.test(x.text) && x.met)).toBe(true)
  })

  it('6. no property price cap — an expensive property still passes', () => {
    const r = evaluate(FHSS, answers({ propertyPrice: 4_000_000 }))
    expect(r.bucket).toBe('yes')
  })

  it('7. owner-occupier intent = No fails', () => {
    const r = evaluate(FHSS, answers({}, { ppr: 'No' }))
    expect(r.bucket).toBe('no')
  })

  it('8. a company/trust entity is excluded (natural persons only)', () => {
    const r = evaluate(FHSS, answers({}, { entity: 'Company' }))
    expect(r.bucket).toBe('no')
    expect(r.ruleResults.some((x) => /individuals only/i.test(x.text))).toBe(true)
  })

  it("9. a partner's prior ownership does NOT disqualify — eligibility is individual", () => {
    const r = evaluate(
      FHSS,
      answers({ hasPartner: true }, { hasPartner: 'Yes', partnerOwned: 'Yes' }),
    )
    expect(r.bucket).toBe('yes')
  })

  it('10. no minimum deposit test — any deposit level passes', () => {
    const r = evaluate(FHSS, answers({ deposit: 0 }))
    expect(r.bucket).toBe('yes')
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('Federal: Help to Buy', () => {
  it('11. eligible single applicant baseline', () => {
    const r = evaluate(HELP_TO_BUY, answers({ propertyPrice: 700_000 }))
    expect(r.bucket).toBe('yes')
  })

  it('12. a joint applicant is eligible (regression: was wrongly rejected by a stray single-parent flag)', () => {
    const r = evaluate(
      HELP_TO_BUY,
      answers({ hasPartner: true, income: 160_000, propertyPrice: 700_000 }, { buyingWith: 'Jointly' }),
    )
    expect(r.bucket).not.toBe('no')
  })

  it('13. single-applicant income exceeds the $103,000 cap and fails', () => {
    const r = evaluate(HELP_TO_BUY, answers({ income: 110_000, propertyPrice: 700_000 }))
    expect(r.bucket).toBe('no')
  })

  it('14. joint-applicant income exactly at the $165,000 cap passes (boundary)', () => {
    const r = evaluate(
      HELP_TO_BUY,
      answers({ hasPartner: true, income: 165_000, propertyPrice: 700_000 }, { buyingWith: 'Jointly' }),
    )
    expect(r.bucket).not.toBe('no')
  })

  it('15. a Permanent Resident fails — Help to Buy requires citizenship, not just residency', () => {
    const r = evaluate(HELP_TO_BUY, answers({ propertyPrice: 700_000 }, { citizenship: 'Permanent Resident' }))
    expect(r.bucket).toBe('no')
  })

  it('16. a deposit below the 2% minimum fails', () => {
    const r = evaluate(HELP_TO_BUY, answers({ propertyPrice: 700_000, deposit: 5_000 }))
    expect(r.bucket).toBe('no')
  })

  it('17. NSW price between the two regional tiers is a "check", not a hard pass/fail', () => {
    const r = evaluate(HELP_TO_BUY, answers({ state: 'NSW', propertyPrice: 900_000 }))
    expect(r.bucket).toBe('check')
  })

  it('18. ACT price within its single national cap passes', () => {
    const r = evaluate(HELP_TO_BUY, answers({ state: 'ACT', propertyPrice: 950_000 }))
    expect(r.bucket).not.toBe('no')
  })

  it('19. price over the applicable cap fails', () => {
    const r = evaluate(HELP_TO_BUY, answers({ state: 'ACT', propertyPrice: 1_100_000 }))
    expect(r.bucket).toBe('no')
  })

  it('20. under 18 fails', () => {
    const r = evaluate(HELP_TO_BUY, answers({ propertyPrice: 700_000 }, { is18: 'No' }))
    expect(r.bucket).toBe('no')
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('Federal: 5% Deposit Scheme', () => {
  it('21. eligible solo first-home-buyer baseline', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ deposit: 35_000 }))
    expect(r.bucket).toBe('yes')
  })

  it('22. a joint applicant is eligible (regression: was wrongly rejected by a stray single-parent flag)', () => {
    const r = evaluate(
      FIVE_PERCENT_DEPOSIT,
      answers({ hasPartner: true, deposit: 35_000 }, { buyingWith: 'Jointly' }),
    )
    expect(r.bucket).not.toBe('no')
  })

  it('23. an applicant who previously owned property fails (own 10-year test)', () => {
    const r = evaluate(
      FIVE_PERCENT_DEPOSIT,
      answers({ firstHomeBuyer: false, deposit: 35_000 }, { everOwned: 'Yes' }),
    )
    expect(r.bucket).toBe('no')
  })

  it('24. no income cap — a very high income still passes', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ income: 5_000_000, deposit: 35_000 }))
    expect(r.bucket).toBe('yes')
  })

  it('25. under 18 fails', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ deposit: 35_000 }, { is18: 'No' }))
    expect(r.bucket).toBe('no')
  })

  it('26. NT price in Darwin (higher tier) passes at $700k', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ state: 'NT', propertyPrice: 700_000, deposit: 35_000 }))
    expect(r.bucket).not.toBe('no')
  })

  it('27. NT price outside Darwin (rest-of-territory, classified suburb) fails at $700k — over the $600k cap there', () => {
    const r = evaluate(
      FIVE_PERCENT_DEPOSIT,
      answers({ state: 'NT', propertyPrice: 700_000, deposit: 35_000, propertyRegion: 'rest' }),
    )
    expect(r.bucket).toBe('no')
  })

  it('28. a deposit below the 5% minimum fails', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ deposit: 10_000, propertyPrice: 700_000 }))
    expect(r.bucket).toBe('no')
  })

  it("29. a partner's prior ownership is NOT currently caught (documented limitation, unlike NSW FHBAS)", () => {
    const r = evaluate(
      FIVE_PERCENT_DEPOSIT,
      answers({ hasPartner: true, deposit: 35_000 }, { hasPartner: 'Yes', partnerOwned: 'Yes' }),
    )
    expect(r.bucket).not.toBe('no')
  })

  it('30. a company/trust entity is excluded (natural persons only)', () => {
    const r = evaluate(FIVE_PERCENT_DEPOSIT, answers({ deposit: 35_000 }, { entity: 'Trust' }))
    expect(r.bucket).toBe('no')
  })
})

// ─────────────────────────────────────────────────────────────────────────
describe('Federal: Family Home Guarantee (5% Deposit Scheme for Single Parents)', () => {
  it('31. eligible solo single-parent applicant baseline', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }))
    expect(r.bucket).not.toBe('no')
  })

  it('32. a joint applicant fails — this pathway genuinely requires a solo application', () => {
    const r = evaluate(
      FAMILY_HOME_GUARANTEE,
      answers({ hasPartner: true, deposit: 14_000 }, { buyingWith: 'Jointly' }),
    )
    expect(r.bucket).toBe('no')
  })

  it('33. under 18 fails', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }, { is18: 'No' }))
    expect(r.bucket).toBe('no')
  })

  it('34. a deposit below the 2% minimum fails', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 2_000, propertyPrice: 700_000 }))
    expect(r.bucket).toBe('no')
  })

  it('35. no income cap — a very high income still passes', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ income: 5_000_000, deposit: 14_000 }))
    expect(r.bucket).not.toBe('no')
  })

  it('36. price over the applicable state cap fails', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ state: 'TAS', propertyPrice: 800_000, deposit: 14_000 }))
    expect(r.bucket).toBe('no')
  })

  it('37. a Permanent Resident passes — citizen or PR both accepted', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }, { citizenship: 'Permanent Resident' }))
    expect(r.bucket).not.toBe('no')
  })

  it('38. single-parent status cannot be fully verified from the questionnaire — downgrades to "check", never a hard fail', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }))
    expect(r.bucket).not.toBe('no')
    expect(r.ruleResults.some((x) => x.isCheck && /single parent/i.test(x.text))).toBe(true)
  })

  it('39. owner-occupier intent = No fails', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }, { ppr: 'No' }))
    expect(r.bucket).toBe('no')
  })

  it('40. a company/trust entity is excluded (natural persons only)', () => {
    const r = evaluate(FAMILY_HOME_GUARANTEE, answers({ deposit: 14_000 }, { entity: 'Company' }))
    expect(r.bucket).toBe('no')
  })
})
