/**
 * Branching, validation and the Flow_Logic decision rules from the Excel,
 * implemented client-side for the questionnaire UI. This preserves the business
 * logic exactly; it does NOT change the backend eligibility engine — at the end
 * we map answers down to the existing `EligibilityAnswers` shape the current API
 * already consumes.
 */
import type { Answers, StateCode } from './types'
import { inferRegion } from './postcodes'
import type { EligibilityAnswers } from '@/lib/schemes/eligibilityClient'

// ─────────────────────────────────────────────────────────────────────────────
// Branching visibility (which questions are shown)
// ─────────────────────────────────────────────────────────────────────────────
export const isJoint = (a: Answers) => a.buyingWith === 'Jointly'
export const showCoCitizenship = isJoint          // C05
export const showCoDob = isJoint                  // C03
export const showCoIncome = isJoint               // C16
export const showPartnerOwned = (a: Answers) => a.hasPartner === 'Yes'      // C08
export const showMoveIn = (a: Answers) => a.ppr === 'Yes'                   // C11
export const showNsw = (a: Answers) => a.state === 'NSW' && a.propertyType === 'New' // N01
// Q01 (QLD "new home never occupied") was removed by product decision: selecting
// Property Type = "New" is now taken to represent a Queensland new home, so the
// separate question is no longer asked. N01 is unchanged — NSW still asks it.
export const showVicLivedIn = (a: Answers) => a.state === 'VIC' && a.everOwned === 'Yes' // V01
export const showVic = (a: Answers) => a.state === 'VIC'                    // V02, V03

// ─────────────────────────────────────────────────────────────────────────────
// Age helper (C03 co-buyer DOB → 18+)
// ─────────────────────────────────────────────────────────────────────────────
export function ageFromIso(iso: string): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

const RESIDENT_OK = new Set(['Australian Citizen', 'Permanent Resident', 'NZ Special Category Visa (SCV) holder'])

// ─────────────────────────────────────────────────────────────────────────────
// Per-step validation. Returns a map of field → friendly message.
// ─────────────────────────────────────────────────────────────────────────────
export type Errors = Partial<Record<keyof Answers, string>>

const SUPPORTED_STATES = new Set(['NSW', 'VIC', 'QLD', 'SA', 'ACT', 'WA', 'TAS', 'NT'])

// Step 1 — Getting started (name + state)
// Step 1 — the fast path. State, price and prior ownership decide most of an
// applicant's eligibility, so they are asked first and everything else becomes
// refinement. Name is deliberately NOT here — it adds nothing to the estimate.
export function validateFast(a: Answers): Errors {
  const e: Errors = {}
  // The message lists the set rather than hard-coding two states, so it stops
  // going stale each time a state is added (it still said "NSW or VIC" after
  // QLD went live).
  if (!a.state || !SUPPORTED_STATES.has(a.state)) {
    const list = [...SUPPORTED_STATES]
    e.state = `Choose ${list.slice(0, -1).join(', ')} or ${list[list.length - 1]} to continue.`
  }
  if (a.price == null || a.price <= 0) e.price = 'Enter your target price — an estimate is fine.'
  if (!a.everOwned) e.everOwned = 'This is required to continue.'
  return e
}

// Step 2 — The property (type, N01, price, location, PPR, move-in)
export function validateProperty(a: Answers): Errors {
  const e: Errors = {}
  if (!a.propertyType) e.propertyType = 'Select the type of property you’re buying.'
  if (showNsw(a) && !a.nswNeverOccupied) e.nswNeverOccupied = 'Please answer the NSW new-home question.'
  // No Q01 validation — the QLD new-home question was removed, so a Queensland
  // applicant choosing "New" must be able to complete this step with no hidden
  // required field.
  if (a.propertyType === 'Land + Build') {
    if (a.landPrice == null || a.landPrice <= 0) e.landPrice = 'Enter the land purchase price.'
    if (a.buildPrice == null || a.buildPrice <= 0) e.buildPrice = 'Enter the building contract amount.'
  } else {
    if (a.price == null || a.price <= 0) e.price = 'Enter the purchase price.'
  }
  if (!a.postcode || !a.state) e.postcode = 'Search and select a suburb.'
  if (!a.ppr) e.ppr = 'Let us know if this will be your home.'
  if (showMoveIn(a) && !a.moveIn) e.moveIn = 'Confirm your move-in timeframe.'
  return e
}

// Step 3 — About you (name, age, buying structure, citizenship + co-buyer, entity)
export function validateAbout(a: Answers): Errors {
  const e: Errors = {}
  if (!a.name.trim()) e.name = 'Enter your name to continue.'
  if (!a.is18) e.is18 = 'This is required to continue.'
  if (!a.buyingWith) e.buyingWith = 'Are you buying alone or with someone?'
  if (!a.citizenship) e.citizenship = 'Select your citizenship or residency status.'
  if (showCoCitizenship(a) && !a.coCitizenship) e.coCitizenship = 'Select your co-buyer’s status.'
  if (showCoDob(a)) {
    // Presence + valid date here; the 18+ rule is enforced as a hard stop
    // (offers to continue as a sole applicant), matching the reference flow.
    if (!a.coDob) e.coDob = 'Enter your co-buyer’s date of birth.'
    else if (ageFromIso(a.coDob) == null) e.coDob = 'Enter a valid date.'
  }
  if (!a.entity) e.entity = 'Select who is purchasing the property.'
  return e
}

// Step 4 — Ownership history (prior ownership + V01, partner + C08, prior grant, V02/V03)
export function validateHistory(a: Answers): Errors {
  const e: Errors = {}
  if (!a.everOwned) e.everOwned = 'This is required.'
  if (showVicLivedIn(a) && !a.vicLivedInPrior) e.vicLivedInPrior = 'This is required.'
  if (!a.hasPartner) e.hasPartner = 'This is required.'
  if (showPartnerOwned(a) && !a.partnerOwned) e.partnerOwned = 'This is required.'
  if (!a.priorBenefit) e.priorBenefit = 'This is required.'
  if (showVic(a) && !a.vicAdf) e.vicAdf = 'This is required.'
  if (showVic(a) && !a.vicFamilyViolence) e.vicFamilyViolence = 'Please answer, or choose “Prefer not to say”.'
  return e
}

// Step 5 — Income
export function validateIncome(a: Answers): Errors {
  const e: Errors = {}
  if (a.income == null || a.income < 0) e.income = 'Enter your annual taxable income.'
  if (showCoIncome(a) && (a.coIncome == null || a.coIncome < 0)) e.coIncome = 'Enter your co-buyer’s annual income.'
  return e
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow_Logic — hard stops (block) and soft stops (exclude schemes, explain)
// ─────────────────────────────────────────────────────────────────────────────
export interface HardStop { title: string; message: string; allowSole?: boolean }

export function hardStop(a: Answers): HardStop | null {
  if (a.is18 === 'No') {
    return { title: 'You need to be 18 or older', message: 'First-home buyer grants and schemes require applicants to be at least 18. We can still show you general first-home content.' }
  }
  if (isJoint(a) && a.coDob) {
    const age = ageFromIso(a.coDob)
    if (age != null && age < 18) {
      return { title: 'Your co-buyer must be 18 or older', message: 'A joint application needs every buyer to be 18+. You can continue as a sole applicant instead.', allowSole: true }
    }
  }
  return null
}

export interface SoftStop { code: string; label: string; reason: string }

/** Soft stops that change the results (owner-occupier, residency, structure…). */
export function softStops(a: Answers): SoftStop[] {
  const out: SoftStop[] = []
  if (a.ppr === 'No') {
    out.push({ code: 'ppr', label: 'Not owner-occupied', reason: 'You indicated this won’t be your principal place of residence. Most first-home grants and stamp-duty concessions require you to live in the home.' })
  } else if (a.moveIn === 'No') {
    out.push({ code: 'movein', label: 'Move-in timeframe', reason: 'You may not move in within the required government timeframe — occupancy conditions apply to most schemes and should be confirmed.' })
  }
  const resNotOk = a.citizenship !== '' && !RESIDENT_OK.has(a.citizenship)
  const coResNotOk = isJoint(a) && a.coCitizenship !== '' && !RESIDENT_OK.has(a.coCitizenship)
  if (resNotOk || coResNotOk) {
    out.push({ code: 'residency', label: 'Residency', reason: 'A buyer’s residency status is outside the citizen / permanent resident / NZ SCV categories most schemes require. Verify eligibility with the relevant authority.' })
  }
  if (a.entity === 'Company' || a.entity === 'Trust') {
    out.push({ code: 'entity', label: 'Company / trust purchase', reason: 'First-home buyer benefits are generally available only to individuals (natural persons), not companies or trusts.' })
  }
  if (a.priorBenefit === 'Yes') {
    out.push({ code: 'priorbenefit', label: 'Prior grant received', reason: 'You or your spouse have previously received a First Home Owner Grant or concession — these benefits are generally available only once.' })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// First-home status + mapping to the EXISTING API query (no contract change)
// ─────────────────────────────────────────────────────────────────────────────

/** First-home buyer status, honouring the VIC "lived in it?" nuance (V01). */
export function isFirstHomeBuyer(a: Answers): boolean {
  if (a.priorBenefit === 'Yes') return false
  if (a.everOwned !== 'Yes') return true
  // Owned before: VIC still allows it if they never lived in it as their PPR.
  if (a.state === 'VIC' && a.vicLivedInPrior === 'No') return true
  return false
}

const PROPERTY_TYPE_MAP: Record<string, EligibilityAnswers['propertyType']> = {
  New: 'house',
  'Established (Existing)': 'house',
  'Off-the-Plan': 'offplan',
  'Land + Build': 'house',
}

/**
 * The property CATEGORY, kept separate from the dwelling-shape value above.
 *
 * `PROPERTY_TYPE_MAP` answers "what kind of dwelling is it?" and deliberately
 * collapses New and Established into `house` — every scheme that matches on
 * dwelling keywords ("house", "unit", "townhouse") depends on that and must not
 * change. It cannot answer "is this a new home or an established one?", which is
 * what Queensland needs: the First Home Concession is for established homes and
 * the First Home (New Home) Concession is for new ones, and they are separate
 * schemes with different rules.
 *
 * So the category travels alongside the type rather than replacing it. Callers
 * that do not set it (e.g. the home-page calculator) leave category-restricted
 * schemes unfiltered, exactly as before.
 */
const PROPERTY_CATEGORY_MAP: Record<string, EligibilityAnswers['propertyCategory']> = {
  New: 'new',
  'Established (Existing)': 'established',
  'Off-the-Plan': 'offplan',
  'Land + Build': 'land',
}

/** Combined household income used for income-tested schemes. */
export function combinedIncome(a: Answers): number {
  return (a.income ?? 0) + (isJoint(a) ? a.coIncome ?? 0 : 0)
}

const hasAnyPartner = (a: Answers) => isJoint(a) || a.hasPartner === 'Yes'

/** Map the full questionnaire down to the existing eligibility API query. */
export function toEligibilityAnswers(a: Answers): EligibilityAnswers {
  const isLandAndBuild = a.propertyType === 'Land + Build'
  const combinedPrice = isLandAndBuild ? (a.landPrice || 0) + (a.buildPrice || 0) : (a.price ?? 0)

  return {
    state: a.state || 'VIC',
    firstHomeBuyer: isFirstHomeBuyer(a),
    income: combinedIncome(a),
    hasPartner: hasAnyPartner(a),
    propertyPrice: combinedPrice,
    landPrice: isLandAndBuild && typeof a.landPrice === 'number' ? a.landPrice : null,
    deposit: typeof a.deposit === 'number' ? a.deposit : null,
    propertyType: a.propertyType ? PROPERTY_TYPE_MAP[a.propertyType] : 'house',
    propertyCategory: a.propertyType ? PROPERTY_CATEGORY_MAP[a.propertyType] : undefined,
    // Only classified suburbs carry a region; anything else stays undefined and
    // the engine keeps its previous "confirm the cap for your suburb" answer.
    propertyRegion: a.postcode ? inferRegion(a.postcode) : undefined,
    rawAnswers: a, // Pass the full Answers object down for deep evaluation!
  }
}

/** Legacy step shapes so the existing results/* pages keep working unchanged. */
export function toLegacySteps(a: Answers) {
  const partner = hasAnyPartner(a)
  return {
    step1: { firstName: a.name.trim(), state: (a.state || 'VIC') as StateCode, buyingWith: partner ? ('partner' as const) : ('solo' as const) },
    step2: { annualIncome: a.income ?? 0, partnerIncome: isJoint(a) ? a.coIncome ?? 0 : 0, monthlyExpenses: 0 },
    step3: {
      depositAmount: a.deposit ?? 0,
      targetPropertyPrice: a.propertyType === 'Land + Build' ? (a.landPrice || 0) + (a.buildPrice || 0) : (a.price ?? 0),
      propertyType: (a.propertyType ? PROPERTY_TYPE_MAP[a.propertyType] : 'house') as 'house' | 'townhouse' | 'apartment' | 'offplan',
      firstHomeBuyer: isFirstHomeBuyer(a),
    },
  }
}
