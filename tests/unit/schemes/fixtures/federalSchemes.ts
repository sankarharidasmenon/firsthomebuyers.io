import type { ApiScheme } from '@/lib/schemes/eligibilityClient'

/**
 * Shared Federal scheme fixtures, pinned to the field values verified against
 * the ATO/Housing Australia source documents in RulesEngine/Federal/ (session
 * notes, 2026-08-29/30). Consumed by federalSchemes.test.ts (behavioural
 * regression) and eligibilityPairwise.test.ts (structural invariants over a
 * pairwise-covering set of inputs) so the two suites can never drift apart.
 *
 * If the LIVE Supabase row for one of these schemes no longer matches its
 * fixture below, that is data drift, not a code bug — reapply the fix from
 * the session history rather than editing the fixture to match.
 */

export const FHSS: ApiScheme = {
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

export const HELP_TO_BUY: ApiScheme = {
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

export const FIVE_PERCENT_DEPOSIT: ApiScheme = {
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

export const FAMILY_HOME_GUARANTEE: ApiScheme = {
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

export const FEDERAL_SCHEMES = [FHSS, HELP_TO_BUY, FIVE_PERCENT_DEPOSIT, FAMILY_HOME_GUARANTEE]
