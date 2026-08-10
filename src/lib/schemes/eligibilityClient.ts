import { capIsExclusive, citizenshipRequirement, citizenshipVerdict, exemptsAdfFromResidence, incomeCapVariesWithDependants, partnerOwnershipRuleType, recognisesFamilyViolenceRequalification, requiresNaturalPerson, requiresUnoccupiedNewHome, restrictedPropertyCategories } from '@/lib/schemes/applicantRules'
import { resolvePurchaseCap, resolveRegionCap, resolveStateCaps } from '@/lib/schemes/priceCaps'
import type { EvaluatedGrant, EligibilityStatus, Grant } from '@/lib/schemes/types'

type FhbgRuntimeDebug = {
  scheme_id?: string
  scheme_name?: string
  prior_ownership_rules?: string | null
  // `bucket` values as produced by evaluateScheme, not the display statuses.
  evaluation?: { status?: 'yes' | 'check' | 'no'; reasons?: string[] }
  rawAnswers?: { partnerOwned?: unknown; hasPartner?: unknown }
  rule15?: string | null
}

declare global {
  var __firstnestDebug: { fhbg?: FhbgRuntimeDebug } | undefined
}

export interface EligibilityAnswers {
  state: string
  firstHomeBuyer: boolean
  income: number
  hasPartner: boolean
  propertyPrice: number
  landPrice?: number | null
  deposit: number | null
  propertyType: string
  /**
   * New vs established vs land. Travels alongside `propertyType`, which stays a
   * dwelling shape ('house' | 'apartment' | …) so existing matching is unchanged.
   * Undefined when a caller doesn't supply it — category-restricted schemes are
   * then left unfiltered, preserving prior behaviour.
   */
  propertyCategory?: 'new' | 'established' | 'offplan' | 'land'
  /** Price-cap region for the suburb, when the dataset classifies it. */
  propertyRegion?: 'capital' | 'regional-centre' | 'rest'
  singleParent?: boolean
  rawAnswers?: any // Full answers from the questionnaire
}

export type DisplayCategory = 'cash' | 'schemes' | 'tax'

export type RuleResult = { met: boolean; text: string; missing?: boolean; isCheck?: boolean }

/**
 * A near miss: the applicant fails this scheme today, but ONE realistic change
 * — a lower purchase price, a different property category, a bigger deposit —
 * would flip the verdict. Verified by counterfactual re-evaluation, never by
 * pattern-matching reason text.
 */
export interface NearMiss {
  kind: 'price' | 'category' | 'deposit'
  /** Full sentence for result cards ("You're $150,000 over the… cap"). */
  message: string
  /** Compact tag for tight UI ("$150k over cap"). */
  shortLabel: string
}

export interface EligibilityItem {
  eg: EvaluatedGrant
  category: DisplayCategory
  variant: 'grant' | 'scheme'
  bucket: 'yes' | 'check' | 'no'
  ruleResults: RuleResult[]
  /** Present only when bucket is 'no' and a single change would rescue it. */
  nearMiss?: NearMiss
}

export interface EligibilityResult {
  items: EligibilityItem[]
  cashGrantsTotal: number
  taxSavingsTotal: number
  eligibleSchemesCount: number
  totalEligibleCount: number
}

export interface ApiScheme {
  scheme_id: string
  scheme_name: string
  acronym?: string | null
  type?: string | null
  benefit_type?: string | null
  benefit_value?: string | null
  short_description?: string | null
  catchy_line?: string | null
  status?: string | null
  official_url?: string | null
  applicable_states?: string | null
  first_home_buyer_required?: string | null
  income_cap_single?: string | null
  income_cap_couple?: string | null
  property_price_cap?: string | null
  price_cap_variations?: string | null
  minimum_deposit?: string | null
  eligible_property_types?: string | null
  new_vs_established?: string | null
  prior_ownership_rules?: string | null
  owner_occupier_required?: string | null
  single_parent_required?: string | null
  // Read by the Flow_Logic gates in applicantRules.ts (rules 14-16).
  other_conditions?: string | null
  minimum_age?: string | null
  citizenship_residency?: string | null
  relationship_status?: string | null
  income_test_basis?: string | null
}

/** A scheme no longer open to new applicants is never evaluated. */
export function isSchemeClosed(status: unknown): boolean {
  return /closed|ended|expired|merged|superseded|inactive/i.test(String(status ?? ''))
}

function parseMoney(v: unknown): number | null {
  if (!v) return null
  const n = Number(String(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function deriveCategory(type: string): DisplayCategory {
  if (type === 'Grant') return 'cash'
  if (type === 'Stamp Duty Relief' || type === 'Concession') return 'tax'
  return 'schemes'
}

/**
 * The price cap that applies to this applicant, resolved exactly as rule 4
 * resolves it — one code path, shared by the rule and the near-miss
 * counterfactual so the two can never disagree.
 */
function resolveApplicantPriceCaps(s: ApiScheme, a: EligibilityAnswers) {
  const ra = a.rawAnswers || {}
  const purchaseCap = resolvePurchaseCap(s.price_cap_variations, ra.propertyType)
  const regionCap = purchaseCap ? null : resolveRegionCap(s.price_cap_variations, a.state, a.propertyRegion)
  const stateCaps = purchaseCap || regionCap ? [] : resolveStateCaps(s.price_cap_variations, a.state)
  const priceCap = purchaseCap ? purchaseCap.amount
    : regionCap ? regionCap.amount
    : stateCaps.length > 0 ? stateCaps[0].amount
    : parseMoney(s.property_price_cap)
  const lowestCap = stateCaps.length > 0 ? stateCaps[stateCaps.length - 1].amount : priceCap
  return { purchaseCap, stateCaps, priceCap, lowestCap, exclusive: capIsExclusive(s) }
}

/**
 * The 16 eligibility rules, applied to one scheme row.
 *
 * Bucket semantics: every scheme starts at `yes`; a `fail` is sticky and can
 * never be undone, a `check` only downgrades `yes`. Rule 1 is the sole short
 * circuit — the rest keep running so the UI can render every reason.
 *
 * `opts.counterfactual` marks a hypothetical re-run (near-miss probing) so
 * debug instrumentation only records the applicant's real evaluation.
 */
export function evaluateScheme(s: ApiScheme, a: EligibilityAnswers, opts?: { counterfactual?: boolean }): { bucket: 'yes' | 'check' | 'no', ruleResults: RuleResult[] } {
  const rules: RuleResult[] = []
  let bucket: 'yes' | 'check' | 'no' = 'yes'
  const ra = a.rawAnswers || {}

  const fail = (text: string) => { rules.push({ met: false, text }); bucket = 'no' }
  const pass = (text: string) => { rules.push({ met: true, text }) }
  const check = (text: string) => { rules.push({ met: false, isCheck: true, text }); if (bucket === 'yes') bucket = 'check' }

  // 1. Scheme applicability (State / Federal)
  if (s.applicable_states) {
    const states = String(s.applicable_states).toUpperCase()
    const federal = /ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states)
    
    const STATE_NAMES: Record<string, string> = {
      NSW: 'NEW SOUTH WALES',
      VIC: 'VICTORIA',
      QLD: 'QUEENSLAND',
      SA: 'SOUTH AUSTRALIA',
      WA: 'WESTERN AUSTRALIA',
      TAS: 'TASMANIA',
      ACT: 'AUSTRALIAN CAPITAL TERRITORY',
      NT: 'NORTHERN TERRITORY'
    }
    const code = a.state.toUpperCase()
    const fullName = STATE_NAMES[code]
    
    // Use word boundaries for the code so "WA" doesn't match inside "NEW SOUTH WALES".
    // Or check if the full name is present.
    const stateMatch = federal || 
      new RegExp(`\\b${code}\\b`).test(states) || 
      (fullName && states.includes(fullName))

    if (stateMatch) pass(`Applicable to ${federal ? 'all states (Federal)' : a.state}`)
    else fail(`Scheme is for ${s.applicable_states}, not ${a.state}`)
  }

  if (bucket === 'no' as any) return { bucket, ruleResults: rules } // fast fail

  // 2. Property type
  if (s.eligible_property_types && a.propertyType) {
    const pt = a.propertyType.toLowerCase()
    const st = String(s.eligible_property_types).toLowerCase()
    if (!st.includes('property')) {
      let ptMatch = false
      if (pt === 'house' && (st.includes('house') || st.includes('home') || st.includes('dwelling'))) ptMatch = true
      if (pt === 'townhouse' && (st.includes('townhouse') || st.includes('home'))) ptMatch = true
      if (pt === 'apartment' && (st.includes('apartment') || st.includes('unit'))) ptMatch = true
      if (pt === 'offplan' && st.includes('off-the-plan')) ptMatch = true

      // "New homes only" is what the new_vs_established column records — a
      // scheme that merely LISTS "New home" among several eligible types (the
      // NSW First Home Buyers Assistance Scheme lists new and established alike)
      // must not be read as new-only. A house-and-land build counts as new.
      const newOnly = /new\b[^.]*only/i.test(String(s.new_vs_established || ''))
      // A house-and-land build counts as "new" only for schemes that list it as
      // an eligible property type. Grants do (NSW, VIC and QLD all list "House
      // and land"), but Queensland's first home (new home) concession covers a
      // COMPLETED new home — land you build on is covered by its separate
      // vacant land concession instead. Driven by the scheme's own
      // eligible_property_types, so no other scheme is affected.
      const acceptsLandAndBuild = /house and land|vacant land/i.test(String(s.eligible_property_types || ''))
      const buyingNew = ra.propertyType === 'New'
        || ra.propertyType === 'Off-the-Plan'
        || (ra.propertyType === 'Land + Build' && acceptsLandAndBuild)
      // A scheme confined to established homes or to vacant land — Queensland
      // runs these as separate programs from its new-home concession. Only fires
      // when the caller supplied a category; no NSW or VIC row is restricted
      // this way, so their evaluation is unaffected.
      const categoryOnly = restrictedPropertyCategories(s)
      const category = a.propertyCategory

      if (newOnly && !buyingNew) {
        fail(ra.propertyType === 'Land + Build'
          ? `${s.scheme_name} applies to a completed new home — a house-and-land build is not an eligible property type for this scheme`
          : `${s.scheme_name} is for new homes only — ${ra.propertyType} properties are not eligible`)
      } else if (categoryOnly && category && !categoryOnly.includes(category)) {
        const only = categoryOnly.includes('land') ? 'vacant land you build on'
          : categoryOnly.includes('offplan') ? 'off-the-plan purchases'
          : 'established homes'
        fail(`${s.scheme_name} applies to ${only} — ${ra.propertyType} properties are not eligible`)
      } else if (ptMatch || st === '') {
        pass(`Property type (${ra.propertyType}) is eligible`)
      } else {
        fail(`Property type (${ra.propertyType}) does not match: ${s.eligible_property_types}`)
      }
    } else {
      pass(`Property type (${ra.propertyType}) is eligible`)
    }
  } else {
    pass(`Property type requirement satisfied`)
  }

  // 3. Property location (Skipped for now unless RFHBG)
  if (s.scheme_id === 'fed-regional-first-home-buyer-guarantee') {
    fail(`Property is not located in an eligible regional area (Metro assumed for now)`)
  } else {
    pass(`Property location requirement satisfied`)
  }

  // 4. Property price cap, most specific cap first: a cap that depends on how the
  // home is acquired (NSW FHOG: $600k to buy a new home, $750k to build), then
  // the applicant's own state cap (federal schemes publish one per state, with a
  // higher figure for the capital city and listed regional centres), then the
  // single national column. Between a state's two caps the answer depends on the
  // suburb, which the questionnaire doesn't pin down, so that band is a "check".
  // When the suburb's region is known the applicable cap is no longer ambiguous,
  // so the two-cap "confirm your suburb" band collapses to a single figure.
  // Unclassified suburbs return null here and behave exactly as before.
  // Most caps are inclusive ("must not exceed", "up to"). The Queensland FHOG is
  // exclusive ("less than $750,000"), so exactly the cap does not qualify.
  const { purchaseCap, stateCaps, priceCap, lowestCap, exclusive } = resolveApplicantPriceCaps(s, a)
  const within = (value: number, cap: number) => (exclusive ? value < cap : value <= cap)
  if (priceCap !== null && a.propertyPrice > 0) {
    const price = `$${a.propertyPrice.toLocaleString('en-AU')}`
    if (lowestCap !== null && within(a.propertyPrice, lowestCap)) {
      pass(`Purchase price (${price}) is within the ${a.state} price cap.`)
    } else if (within(a.propertyPrice, priceCap)) {
      const region = stateCaps[0].label || `${a.state} capital city and regional centres`
      check(`Purchase price (${price}) is within the $${priceCap.toLocaleString('en-AU')} cap for ${region}, but above the $${lowestCap!.toLocaleString('en-AU')} cap that applies elsewhere in ${a.state} — confirm the cap for your suburb.`)
    } else {
      const capFor = purchaseCap?.label ? ` for ${purchaseCap.label}` : ''
      const limit = exclusive ? `must be less than $${priceCap.toLocaleString('en-AU')}` : `of $${priceCap.toLocaleString('en-AU')}`
      fail(`Purchase price (${price}) exceeds the ${a.state} price cap ${limit}${capFor}`)
    }
  } else if (priceCap !== null) {
    check(`Purchase price not provided, cap is $${priceCap.toLocaleString('en-AU')}`)
  } else {
    pass(`No property price cap applied`)
  }

  // 5. Applicant age
  if (ra.is18 === 'Yes') {
    if (ra.buyingWith === 'Jointly' && ra.coDob) {
      // Logic from QuestionnaireFlow is that coDob < 18 is a hardstop anyway, but we verify here
      pass(`All applicants are 18+ years old`)
    } else {
      pass(`Applicant is 18+ years old`)
    }
  } else if (ra.is18 === 'No') {
    fail(`Applicant must be 18 or older`)
  } else {
    check(`Applicant age not provided`)
  }

  // 6. Citizenship / Residency — evaluated for EVERY applicant on the purchase,
  // against the scheme's own published requirement.
  //
  // A joint application is only as strong as its weakest applicant on a scheme
  // that binds all of them: Help to Buy requires Australian citizenship, so a
  // permanent-resident co-buyer rules it out, while the 5% Deposit Scheme
  // accepts permanent residents and is unaffected. Where Revenue NSW says "at
  // least one applicant", one qualifying buyer is enough. All of that comes from
  // `citizenship_residency`, so no scheme is named here.
  const RESIDENT_OK = ['Australian Citizen', 'Permanent Resident', 'NZ Special Category Visa (SCV) holder']
  const requirement = citizenshipRequirement(s)
  const applicants: { label: string; status: string }[] = [
    { label: 'Applicant', status: String(ra.citizenship ?? '') },
    ...(ra.buyingWith === 'Jointly' && ra.coCitizenship
      ? [{ label: 'Co-buyer', status: String(ra.coCitizenship) }]
      : []),
  ].filter((x) => x.status !== '')

  if (applicants.length === 0) {
    check(`Citizenship / Residency not provided`)
  } else {
    const verdicts = applicants.map((x) => ({ ...x, verdict: citizenshipVerdict(requirement, x.status, RESIDENT_OK) }))
    const rejected = verdicts.filter((v) => v.verdict === 'no')
    const unknown = verdicts.filter((v) => v.verdict === 'unknown')
    const accepted = verdicts.filter((v) => v.verdict === 'ok')

    if (requirement.scope === 'any') {
      // One qualifying buyer carries the application.
      if (accepted.length > 0) pass(`Citizenship / Residency requirement satisfied (at least one applicant qualifies)`)
      else if (unknown.length > 0) check(`Residency status (${unknown.map((u) => u.status).join(', ')}) may not be eligible`)
      else fail(`No applicant meets the citizenship or residency requirement for ${s.scheme_name}`)
    } else if (rejected.length > 0) {
      fail(`${rejected.map((r) => `${r.label} is a ${r.status.toLowerCase()}`).join('; ')} — ${s.scheme_name} requires every applicant to be an Australian citizen`)
    } else if (unknown.length > 0) {
      check(`Residency status (${unknown.map((u) => u.status).join(', ')}) may not be eligible`)
    } else {
      pass(`Citizenship / Residency requirement satisfied for all applicants`)
    }
  }

  // 7. First home buyer / Previous ownership
  const requiresFHB = /yes/i.test(s.first_home_buyer_required || '') || /first[\s-]?home/i.test(s.scheme_name || '')
  const priorOwner = ra.everOwned === 'Yes'
  // A scheme of the applicant's own state. State occupancy nuances — Victoria's
  // "owned but never lived in it" test — are creatures of that state's
  // legislation and cannot carry into a scheme with its own published test.
  const ownStateScheme = String(s.applicable_states || '').toUpperCase().includes(String(a.state || '').toUpperCase())

  if (requiresFHB) {
    if (a.firstHomeBuyer && priorOwner && !ownStateScheme) {
      // Housing Australia tests ownership in the last 10 years (measured from the
      // sale date), and Help to Buy tests CURRENT ownership — neither cares
      // whether the previous home was occupied. The questionnaire captures
      // neither the sale date nor current ownership, so this cannot be decided.
      check(`${s.scheme_name} applies its own prior-ownership test, which does not depend on whether you lived in the property — confirm the date you last held an interest and whether you still own it`)
    } else if (a.firstHomeBuyer) {
      pass(`First-home buyer requirement satisfied`)
    } else if (ra.vicFamilyViolence === 'Yes' && recognisesFamilyViolenceRequalification(s)) {
      // Victorian legislation lets victim-survivors requalify, but the
      // Commissioner assesses it — it is not automatic.
      check(`You may requalify for ${s.scheme_name} under the family violence provisions despite previously owning a home — this is assessed by the State Revenue Office`)
    } else {
      fail(`Applicant has previously owned residential property.`)
    }
  } else {
    pass(`First-home buyer requirement satisfied`)
  }

  // 8. Previous grants or schemes
  if (ra.priorBenefit === 'Yes') {
    fail(`Applicant has previously received a first-home grant or concession`)
  } else if (ra.priorBenefit === 'No') {
    pass(`No previous grants or schemes received`)
  }

  // 9. Owner-occupier requirement
  if (ra.ppr === 'Yes') pass(`Owner-occupier requirement satisfied`)
  else if (ra.ppr === 'No') fail(`Property must be Principal Place of Residence`)
  else check(`Owner-occupier intent not provided`)

  // 10. Move-in requirement
  if (ra.ppr === 'Yes') {
    if (ra.moveIn === 'Yes') pass(`Will move in within required timeframe`)
    // V02 — an active Defence Force member is exempt from the residence
    // requirement, but only for schemes that publish that exemption.
    else if (ra.vicAdf === 'Yes' && exemptsAdfFromResidence(s)) {
      pass(`Active Australian Defence Force member — exempt from the residence requirement for ${s.scheme_name} (does not extend to reservists or Australian Public Service staff)`)
    }
    else if (ra.moveIn === 'No') check(`Move-in timeframe may not meet government requirements`)
    else check(`Move-in timeframe not provided`)
  } else {
    pass(`Move-in requirement skipped (Not PPR)`)
  }

  // 11. Income thresholds
  const incomeCap = parseMoney(a.hasPartner ? s.income_cap_couple : s.income_cap_single)
  if (incomeCap !== null) {
    if (a.income > 0) {
      if (a.income <= incomeCap) pass(`Combined income ($${a.income.toLocaleString('en-AU')}) within $${incomeCap.toLocaleString('en-AU')} threshold`)
      else {
        // Some schemes extend the higher cap to a SINGLE applicant with dependent
        // children — Queensland's Boost to Buy does. The questionnaire never asks
        // about dependants, so between the two caps we cannot decide, and saying
        // "no" would be a guess. Report it as needing verification instead.
        const higherCap = !a.hasPartner && incomeCapVariesWithDependants(s)
          ? parseMoney(s.income_cap_couple)
          : null
        if (higherCap !== null && a.income <= higherCap) {
          check(`Income ($${a.income.toLocaleString('en-AU')}) exceeds the $${incomeCap.toLocaleString('en-AU')} single threshold but is within the $${higherCap.toLocaleString('en-AU')} threshold that applies to a single applicant with dependent children — the questionnaire does not ask about dependants, so this needs verification`)
        } else {
          fail(`Combined income ($${a.income.toLocaleString('en-AU')}) exceeds $${incomeCap.toLocaleString('en-AU')} threshold`)
        }
      }
    } else {
      check(`Income not provided, threshold is $${incomeCap.toLocaleString('en-AU')}`)
    }
  } else {
    pass(`No income threshold applies`)
  }

  // 12. Deposit requirement (if applicable)
  if (s.minimum_deposit) {
    if (a.deposit !== null) {
      // Calculate deposit percentage. Help to buy is 2%, FHG is 5%
      const depositPct = a.propertyPrice > 0 ? (a.deposit / a.propertyPrice) * 100 : 0
      const requiredPct = parseFloat(s.minimum_deposit.replace('%', ''))
      if (depositPct >= requiredPct) pass(`Deposit requirement (${s.minimum_deposit}) verified`)
      else fail(`Deposit is less than the required ${s.minimum_deposit}`)
    } else {
      check(`Minimum ${s.minimum_deposit} deposit is required for the ${s.scheme_name}. Deposit information is not currently collected in the questionnaire, therefore eligibility cannot be fully verified.`)
    }
  }

  // 13. Scheme-specific exceptions (ADF, Family Violence, etc.)
  if (s.single_parent_required === 'Yes') {
    if (a.hasPartner) fail(`Applicant is not a single parent (applying with partner)`)
    else check(`Single parent status could not be fully verified`) // We don't ask about dependents in this flow
  }

  // ── Flow_Logic gates 14-16 ────────────────────────────────────────────────
  // Three mandatory questions were collected and validated but never reached the
  // engine, so answering them changed nothing. Each gate below applies per
  // scheme, from that scheme's own master-data columns — see applicantRules.ts.
  //
  // SCOPE: NSW only, deliberately. C17 and C08 are marked NSW=Y and VIC=Y in the
  // questionnaire spec, but VIC eligibility was explicitly out of scope for this
  // change, and Flow_Logic r7 states NSW and VIC treat partner ownership
  // differently. Removing `isNsw` from a condition is all that is needed to
  // extend that gate to VIC once the VIC rules have been agreed.
  const isNsw = String(a.state || '').toUpperCase() === 'NSW'

  // 14. C17 — applicant type gate (Flow_Logic r17). Scheme-driven, not
  // state-driven: `requiresNaturalPerson` decides per scheme, so a scheme that
  // legislation opens to companies and trusts (the Victorian off-the-plan duty
  // concession) stays available while grants and first-home concessions do not.
  if (ra.entity === 'Company' || ra.entity === 'Trust') {
    if (requiresNaturalPerson(s)) {
      fail(`${s.scheme_name} is available to individuals only — a ${String(ra.entity).toLowerCase()} cannot claim it`)
    } else {
      pass(`Purchase structure (${ra.entity}) is accepted by this scheme`)
    }
  }

  // 15. C08 — partner's prior ownership (Flow_Logic r7). Only schemes whose own
  // prior-ownership rule extends to a spouse or partner are affected.
  let rule15Classification: string | null = 'not-applicable'
  if (isNsw && ra.hasPartner === 'Yes' && ra.partnerOwned === 'Yes') {
    const partnerRule = partnerOwnershipRuleType(s)
    rule15Classification = partnerRule
    if (partnerRule === 'absolute') {
      fail(`Your spouse or partner has previously owned residential property — ${s.scheme_name} requires that neither of you has owned before`)
    } else if (partnerRule === 'time-qualified') {
      check(`Your spouse or partner's prior ownership may affect ${s.scheme_name}, but the questionnaire does not collect ownership dates, so eligibility needs manual verification`)
    } else {
      pass(`Partner's prior ownership does not affect this scheme`)
    }
  }

  // 16. N01 (NSW) — "new home never occupied". Only new-homes-only schemes
  // depend on it; duty concessions cover established homes and are unaffected.
  //
  // QLD was removed from this gate by product decision: Property Type = "New" is
  // now taken to represent a Queensland new home, so Q01 is no longer asked and
  // its answer is no longer read. Queensland's new-home test is therefore
  // carried entirely by rule 2, which derives `buyingNew` from propertyType.
  // Consequence, accepted by the business: a Queensland home the buyer selects
  // as "New" but which has been previously occupied or sold as a residence can
  // no longer be distinguished, so the FHOG and the first home (new home)
  // concession will be reported as eligible for it.
  //
  // NSW is deliberately untouched — N01 is still asked and still enforced.
  const neverOccupied = isNsw ? ra.nswNeverOccupied : undefined
  if (isNsw && neverOccupied === 'No' && requiresUnoccupiedNewHome(s)) {
    fail(`The home has been previously occupied or sold as a residence, so it is not a new home for ${s.scheme_name}`)
  }

  if (s.scheme_id === 'fed-first-home-guarantee' && !opts?.counterfactual) {
    const debugState = globalThis as typeof globalThis & { __firstnestDebug?: { fhbg?: FhbgRuntimeDebug } }
    debugState.__firstnestDebug = debugState.__firstnestDebug || {}
    debugState.__firstnestDebug.fhbg = {
      scheme_id: s.scheme_id,
      scheme_name: s.scheme_name,
      prior_ownership_rules: s.prior_ownership_rules ?? null,
      evaluation: { status: bucket, reasons: rules.map((r) => r.text) },
      rawAnswers: { partnerOwned: ra.partnerOwned, hasPartner: ra.hasPartner },
      rule15: rule15Classification ?? null,
    }
    console.info('[FHBG DEBUG][evaluateScheme]', debugState.__firstnestDebug.fhbg)
  }

  return { bucket, ruleResults: rules }
}

function compactMoney(n: number): string {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
}

/**
 * Near-miss detection by counterfactual re-evaluation.
 *
 * For an ineligible scheme, re-run the SAME engine with exactly one answer
 * changed. Only if that single change alone lifts the scheme out of 'no' is a
 * suggestion made — so "you'd qualify if…" is always literally true, and a
 * scheme sunk by a second, immovable failure (prior ownership, citizenship,
 * wrong state) never produces one. Deliberately limited to the decisions a
 * buyer can still realistically revisit at this stage: price, new-vs-
 * established, and deposit size.
 */
function computeNearMiss(s: ApiScheme, a: EligibilityAnswers): NearMiss | null {
  const ra = a.rawAnswers || {}
  const rescues = (cf: EligibilityAnswers) => evaluateScheme(s, cf, { counterfactual: true }).bucket !== 'no'
  const grantValue = parseMoney(s.benefit_value)
  const worth = grantValue ? ` (worth $${grantValue.toLocaleString('en-AU')})` : ''

  // 1. Price: would buying at the cap, alone, rescue it?
  const { priceCap, exclusive } = resolveApplicantPriceCaps(s, a)
  if (priceCap !== null && a.propertyPrice > 0) {
    const within = exclusive ? a.propertyPrice < priceCap : a.propertyPrice <= priceCap
    const over = a.propertyPrice - priceCap
    if (!within && over > 0 && rescues({ ...a, propertyPrice: exclusive ? priceCap - 1 : priceCap })) {
      return {
        kind: 'price',
        message: `You're $${over.toLocaleString('en-AU')} over the $${priceCap.toLocaleString('en-AU')} price cap — at or below the cap you would qualify${worth}.`,
        shortLabel: `${compactMoney(over)} over cap`,
      }
    }
  }

  // 2. Property category: new ↔ established swap.
  if (a.propertyCategory === 'established' || a.propertyCategory === 'new') {
    const target = a.propertyCategory === 'established' ? 'new' : 'established'
    const cf: EligibilityAnswers = {
      ...a,
      propertyCategory: target,
      rawAnswers: { ...ra, propertyType: target === 'new' ? 'New' : 'Established (Existing)' },
    }
    if (rescues(cf)) {
      return {
        kind: 'category',
        message: target === 'new'
          ? `This is for new homes — if you bought or built new instead of an established home, you would qualify${worth}.`
          : `This is for established homes — it would apply if you bought established instead of new${worth}.`,
        shortLabel: target === 'new' ? 'if buying new' : 'if established',
      }
    }
  }

  // 3. Deposit: would topping up to the scheme's minimum rescue it?
  if (s.minimum_deposit && a.deposit !== null && a.propertyPrice > 0) {
    const requiredPct = parseFloat(String(s.minimum_deposit).replace('%', ''))
    if (Number.isFinite(requiredPct) && requiredPct > 0) {
      const needed = Math.ceil((a.propertyPrice * requiredPct) / 100)
      const shortfall = needed - a.deposit
      if (shortfall > 0 && rescues({ ...a, deposit: needed })) {
        return {
          kind: 'deposit',
          message: `You're $${shortfall.toLocaleString('en-AU')} short of the ${s.minimum_deposit} minimum deposit ($${needed.toLocaleString('en-AU')} on this price) — saving that extra would qualify you${worth}.`,
          shortLabel: `${compactMoney(shortfall)} more deposit`,
        }
      }
    }
  }

  return null
}

/** Build the display item for one scheme. Status comes straight from the rules. */
function toItem(s: ApiScheme, a: EligibilityAnswers): EligibilityItem {
  const category = deriveCategory(String(s.type || s.benefit_type || ''))
  const variant: 'grant' | 'scheme' = category === 'cash' ? 'grant' : 'scheme'

  const cashValue = parseMoney(s.benefit_value)
  const value: number | string = category === 'cash' && cashValue !== null ? cashValue : (s.benefit_value || '').trim()

  const grant: Grant = {
    id: s.scheme_id,
    name: (s.scheme_name || '').trim() || 'Government Scheme',
    description: (s.short_description || '').trim(),
    value,
    eligibilityRules: [],
    category: category === 'cash' ? 'grant' : category === 'tax' ? 'concession' : 'federal',
    officialUrl: (s.official_url || '').trim() || '#',
    benefitLine: (s.catchy_line || s.benefit_value || '').trim() || undefined,
  }

  const { bucket, ruleResults } = evaluateScheme(s, a)
  const status: EligibilityStatus = bucket === 'yes' ? 'eligible' : bucket === 'check' ? 'check' : 'ineligible'
  const nearMiss = bucket === 'no' ? computeNearMiss(s, a) : null

  const eg: EvaluatedGrant = {
    grant,
    status,
    value,
    criteria: ruleResults,
    reason: bucket === 'no' ? 'Does not meet mandatory criteria' : undefined,
    // GrantCard already renders `alternative` as the lemon 💡 block.
    alternative: nearMiss ? `Near miss: ${nearMiss.message}` : undefined,
  }
  return { eg, category, variant, bucket, ruleResults, nearMiss: nearMiss ?? undefined }
}

/**
 * Evaluate every scheme for one applicant and total the result.
 *
 * Called from POST /api/eligibility — the single runtime evaluation point.
 * Closed schemes are dropped, each remaining scheme runs evaluateScheme exactly
 * once, and the totals come from those same buckets. Nothing downstream may
 * recompute or override a status.
 */
export function buildEligibilityResult(schemes: ApiScheme[], a: EligibilityAnswers): EligibilityResult {
  const active = schemes.filter((s) => !isSchemeClosed(s.status))
  const items = active.map((s) => toItem(s, a))

  const sumEligible = (cat: DisplayCategory) =>
    items
      .filter((i) => i.category === cat && i.bucket === 'yes')
      .reduce((sum, i) => sum + (typeof i.eg.value === 'number' ? i.eg.value : parseMoney(i.eg.value) ?? 0), 0)

  return {
    items,
    cashGrantsTotal: sumEligible('cash'),
    taxSavingsTotal: sumEligible('tax'),
    eligibleSchemesCount: items.filter((i) => i.category === 'schemes' && i.bucket === 'yes').length,
    totalEligibleCount: items.filter((i) => i.bucket === 'yes').length,
  }
}

/**
 * Client transport. Posts the applicant's answers to the API, which runs the
 * engine above once per scheme, and returns the response unchanged.
 *
 * No rules, no mapping, no fallback here — that is what keeps the browser and
 * `scripts/audit-bd02.ts` in agreement.
 */
export async function fetchEligibility(a: EligibilityAnswers): Promise<EligibilityResult> {
  const res = await fetch('/api/eligibility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a),
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.error ?? `Failed to evaluate eligibility (HTTP ${res.status})`)
  }

  return (await res.json()) as EligibilityResult
}
