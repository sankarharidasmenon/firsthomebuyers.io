/**
 * Schemes Library calculator engine — deliberately independent of both the
 * Supabase-backed engine (src/lib/schemes/) and the Grant Calculator
 * (src/lib/calculator/grantCalculator.ts).
 *
 * WHY A THIRD, SEPARATE ENGINE
 * The Supabase engine only covers Federal + NSW + VIC, verified against
 * government source documents this session. This engine reads the SQLite
 * reference library instead (src/lib/schemesLibrary/data.ts), which covers
 * all 8 states/territories (28 schemes) but was built by a different,
 * less-verified process — its own author flagged several gaps (see
 * GAPS_TO_VERIFY in data.ts). Keeping this engine separate means a bug or
 * inaccuracy here can never leak into the verified Federal/NSW/VIC results,
 * and vice versa.
 *
 * WHAT THIS CAN AND CANNOT DECIDE
 * The library's `scheme_eligibility` table stores 140 criteria as free text
 * with only an is_mandatory flag — no structured columns to evaluate most of
 * them the way the Supabase engine's applicantRules.ts does. The scheme row
 * itself carries structured columns this engine tests directly:
 * `previous_property_restrictions` (27/28 schemes), `residency_requirement`
 * (27/28), `owner_occupier_required` (26/28, enriched with
 * `min_occupancy_months`/`occupancy_start_months` in the rule text), and
 * `min_age` (always 18 or unset, so not worth asking about).
 *
 * Two more criteria recur across many schemes' free-text
 * `scheme_eligibility` rows but have no backing structured column, so they're
 * tested against a small hand-verified list of scheme_ids read directly out
 * of that table (see REQUIRES_NATURAL_PERSON / REQUIRES_SINGLE_PARENT below)
 * rather than a fragile runtime regex over arbitrary free text:
 *   - "be a natural person / individual (not a company or trust)" — 8 schemes
 *   - "single legal guardian of a dependent" — FED_HGS_FHG_FAMILY only
 *
 * Price caps also split by property type on 4 schemes (NSW_FHBAS,
 * NSW_FHOG, QLD_STAMP_NEW, WA_STAMP_DUTY) into a lower vacant-land/
 * house-and-land band vs the ordinary purchase band — tested via the
 * `vacant_land` propertyType option, using the same location_type text the
 * capital-city/regional split already relies on.
 *
 * Everything else in scheme_eligibility remains free text the user verifies
 * themselves — never silently assumed true, and a scheme is never marked
 * ineligible purely for having an unverifiable text criterion.
 */
import { SCHEMES, PRICE_CAPS, INCOME_CAPS, ELIGIBILITY, type LibraryScheme } from './data'

export type CitizenshipStatus = 'citizen' | 'permanent_resident' | 'other'
export type LocationType = 'capital_city' | 'regional'

export type PurchasingEntity = 'individual' | 'company_or_trust'

export interface CalculatorInput {
  /** 'Federal' schemes are always included regardless of this value. */
  state: string
  /**
   * 'vacant_land' is buying land to build on (or an off-the-plan house-and-
   * land package) — distinct from 'new', because several schemes price-cap
   * vacant land lower than a completed new home (e.g. NSW_FHBAS: $350k vacant
   * land exemption vs $800k for a new/existing home).
   */
  propertyType: 'new' | 'established' | 'offplan' | 'vacant_land'
  propertyPrice: number
  buyingWithPartner: boolean
  /** Household income, if the user supplies it. Omitted income caps are reported as "check". */
  income?: number
  /** Have you owned residential property in Australia before (ever, at any time)? */
  everOwnedProperty: boolean
  citizenshipStatus: CitizenshipStatus
  /** Will you live in the property as your home? */
  willLiveIn: boolean
  /**
   * Capital city vs regional/rest of state. Several Federal schemes price-cap
   * by this exact split (e.g. FED_HTB's Capital_City_NSW vs Rest_of_State_NSW
   * rows) — without it, a price between the two bands can only be reported as
   * "check". Omit if unsure; the price cap then stays a "check" as before.
   */
  locationType?: LocationType
  /**
   * How many years ago the applicant last owned property — only meaningful
   * when everOwnedProperty is true. Resolves time-qualified restrictions like
   * "...or not have owned in the last 10 years" into a definite pass/fail.
   * Omit if unsure; the restriction then stays a "check" as before.
   */
  yearsSinceOwned?: number
  /**
   * Most grant/equity schemes require buying as a natural person, not through
   * a company or trust. Defaults to 'individual' — the overwhelming majority
   * of applicants — so existing callers don't need to change.
   */
  purchasingEntity?: PurchasingEntity
  /**
   * Single legal guardian of at least one dependent child — the specific
   * eligibility condition for the Family Home Guarantee (FED_HGS_FHG_FAMILY),
   * which no other input can infer (buyingWithPartner: false alone doesn't
   * imply single-parent status).
   */
  isSingleParent?: boolean
}

export type MatchStatus = 'eligible' | 'check' | 'ineligible'
type Verdict = 'pass' | 'check' | 'fail' | 'none'

export interface PriceCapVerdict {
  status: 'within' | 'check' | 'over' | 'none'
  /** The band actually used for the verdict, for display. */
  applicableCap: number | null
  lowestRelevantCap: number | null
  highestRelevantCap: number | null
}

export interface IncomeCapVerdict {
  status: 'within' | 'check' | 'over' | 'none'
  cap: number | null
  applicantType: 'Single' | 'Joint' | null
}

export interface SimpleVerdict {
  status: Verdict
  /** The scheme's own published rule, shown verbatim so the user can judge the "check" cases themselves. */
  rule: string | null
}

export interface CalculatorMatch {
  scheme: LibraryScheme
  status: MatchStatus
  reasons: string[]
  priceCap: PriceCapVerdict
  incomeCap: IncomeCapVerdict
  priorOwnership: SimpleVerdict
  citizenship: SimpleVerdict
  ownerOccupier: SimpleVerdict
  entity: SimpleVerdict
  singleParent: SimpleVerdict
  /** Free-text criteria from scheme_eligibility the user must self-verify. */
  toVerify: { text: string; mandatory: boolean }[]
}

export interface CalculatorResult {
  matches: CalculatorMatch[]
  eligibleCount: number
  checkCount: number
  cashGrantsTotal: number
}

const PROPERTY_TYPE_TO_ELIGIBLE: Record<CalculatorInput['propertyType'], (v: string) => boolean> = {
  new: (v) => v === 'Both' || v === 'New' || v === 'New_or_Substantially_Renovated' || v === 'N/A',
  offplan: (v) => v === 'Both' || v === 'New' || v === 'New_or_Substantially_Renovated' || v === 'N/A',
  vacant_land: (v) => v === 'Both' || v === 'New' || v === 'New_or_Substantially_Renovated' || v === 'N/A',
  established: (v) => v === 'Both' || v === 'Established' || v === 'N/A',
}

const PROPERTY_TYPE_LABEL: Record<CalculatorInput['propertyType'], string> = {
  new: 'new',
  offplan: 'new/off-the-plan',
  vacant_land: 'vacant land',
  established: 'established',
}

/** The state-abbreviation tokens each jurisdiction's location_type strings use. */
const STATE_TOKENS: Record<string, string[]> = {
  NSW: ['NSW'],
  VIC: ['VIC', 'Melbourne'],
  QLD: ['QLD'],
  WA: ['WA'],
  SA: ['SA'],
  TAS: ['TAS'],
  ACT: ['ACT'],
  NT: ['NT'],
}
const ALL_STATE_TOKENS = Object.values(STATE_TOKENS).flat()

function priceCapVerdict(
  scheme: LibraryScheme,
  state: string,
  price: number,
  propertyType: CalculatorInput['propertyType'],
  locationType?: LocationType,
): PriceCapVerdict {
  const rows = PRICE_CAPS.filter((c) => c.scheme_id === scheme.scheme_id)
  if (rows.length === 0) return { status: 'none', applicableCap: null, lowestRelevantCap: null, highestRelevantCap: null }

  const tokens = STATE_TOKENS[state] ?? []
  // A cap row is "relevant" if its location_type names this state, or names
  // no state at all — but that "no state" fallback only applies to a
  // single-state scheme, where every row belongs to that one state by
  // virtue of the scheme itself (e.g. NSW_FHBAS's "Vacant_Land_Exemption"
  // carries no state token, but the scheme is NSW-only). A Federal scheme's
  // untagged rows are a different case entirely — FED_HTB's
  // "Jervis_Bay_Norfolk" and "Christmas_Cocos" bands name no state either,
  // but they're specific external territories, not a fallback that should
  // leak into every mainland state's calculation.
  const stateSpecific = rows.filter((r) => {
    const locationType = r.location_type ?? ''
    const namesThisState = tokens.some((t) => locationType.includes(t))
    if (namesThisState) return true
    if (scheme.jurisdiction === 'Federal') return false
    return !ALL_STATE_TOKENS.some((t) => locationType.includes(t))
  })
  let relevant = stateSpecific.length > 0 ? stateSpecific : rows

  // A handful of schemes (NSW_FHBAS, NSW_FHOG, QLD_STAMP_NEW, WA_STAMP_DUTY)
  // carry a separate, usually lower, vacant-land/house-and-land band (e.g.
  // NSW_FHBAS's "Vacant_Land_Exemption" at $350k vs "Statewide_NSW_Exemption"
  // at $800k). Split on that before anything else: a vacant-land buyer should
  // only ever see the land band, and — just as importantly — an ordinary
  // house buyer should never have that lower land cap dragging their range
  // down into a false "check". Schemes with no land-specific band have no
  // rows tagged this way, so both `landRows` and the split are no-ops.
  const isLandRow = (locationType: string | null) => /land/i.test(locationType ?? '')
  const landRows = relevant.filter((r) => isLandRow(r.location_type))
  const nonLandRows = relevant.filter((r) => !isLandRow(r.location_type))
  if (propertyType === 'vacant_land') {
    if (landRows.length > 0) relevant = landRows
  } else if (nonLandRows.length > 0) {
    relevant = nonLandRows
  }

  // Several Federal schemes split their cap by Capital_City_{STATE} vs
  // Rest_of_State_{STATE} — if the applicant told us which, narrow to that
  // band so the verdict resolves instead of sitting at "check". Schemes that
  // don't use this split (e.g. NSW_FHBAS's Concession/Exemption/Vacant_Land
  // bands) have no matching rows here, so `banded` stays empty and the full
  // `relevant` set is used exactly as before.
  if (locationType) {
    const bandToken = locationType === 'capital_city' ? 'Capital_City' : 'Rest_of_State'
    const banded = relevant.filter((r) => (r.location_type ?? '').includes(bandToken))
    if (banded.length > 0) relevant = banded
  }

  const amounts = relevant.map((r) => r.price_cap_dollars).filter((n): n is number => n !== null)
  if (amounts.length === 0) return { status: 'none', applicableCap: null, lowestRelevantCap: null, highestRelevantCap: null }

  const highest = Math.max(...amounts)
  const lowest = Math.min(...amounts)

  if (price <= lowest) return { status: 'within', applicableCap: lowest, lowestRelevantCap: lowest, highestRelevantCap: highest }
  if (price <= highest) return { status: lowest === highest ? 'within' : 'check', applicableCap: highest, lowestRelevantCap: lowest, highestRelevantCap: highest }
  return { status: 'over', applicableCap: highest, lowestRelevantCap: lowest, highestRelevantCap: highest }
}

function incomeCapVerdict(scheme: LibraryScheme, buyingWithPartner: boolean, income: number | undefined): IncomeCapVerdict {
  const rows = INCOME_CAPS.filter((c) => c.scheme_id === scheme.scheme_id)
  if (rows.length === 0) return { status: 'none', cap: null, applicantType: null }

  const wanted: 'Single' | 'Joint' = buyingWithPartner ? 'Joint' : 'Single'
  const row = rows.find((r) => r.applicant_type === wanted) ?? rows.find((r) => r.applicant_type === 'Single_Parent') ?? rows[0]
  const cap = row?.income_cap_dollars ?? null
  if (cap === null) return { status: 'none', cap: null, applicantType: wanted }
  if (income === undefined) return { status: 'check', cap, applicantType: wanted }
  return { status: income <= cap ? 'within' : 'over', cap, applicantType: wanted }
}

/**
 * `previous_property_restrictions` is free text with three real shapes seen
 * in the library:
 *   - explicit exception ("Can be previous home owner") → the scheme doesn't
 *     care, always passes regardless of the applicant's history.
 *   - time-qualified ("...or not have owned in the last 10 years") → prior
 *     ownership only matters within a lookback window. If the applicant told
 *     us how many years since they last owned, that resolves to a definite
 *     pass/fail; otherwise it's a genuine "check", not a fail.
 *   - absolute ("Must not have owned...", "Must be first home buyer") → any
 *     prior ownership fails it outright.
 * Unrecognised or empty text never fails the applicant — it just can't be
 * mechanically tested, so it stays out of this verdict (still shown via
 * `rule` when present, and via the scheme_eligibility checklist).
 */
function priorOwnershipVerdict(scheme: LibraryScheme, everOwned: boolean, yearsSinceOwned?: number): SimpleVerdict {
  const text = scheme.previous_property_restrictions
  if (!text || text === 'N/A') return { status: 'none', rule: null }

  const allowsPriorOwnership = /can be previous home owner|may still be eligible|previous owner/i.test(text) && /can be|may/i.test(text)
  if (allowsPriorOwnership) return { status: 'pass', rule: text }

  if (!everOwned) return { status: 'pass', rule: text }

  const timeMatch = text.match(/(?:last|within) (\d+) years/i)
  if (timeMatch) {
    if (yearsSinceOwned === undefined) return { status: 'check', rule: text }
    const thresholdYears = Number(timeMatch[1])
    return { status: yearsSinceOwned >= thresholdYears ? 'pass' : 'fail', rule: text }
  }

  const absolute = /must not have owned|cannot have (previously )?owned|must be (a )?first home buyer/i.test(text)
  if (absolute) return { status: 'fail', rule: text }

  return { status: 'check', rule: text }
}

function citizenshipVerdict(scheme: LibraryScheme, status: CitizenshipStatus): SimpleVerdict {
  const req = scheme.residency_requirement
  if (!req || req === 'N/A' || req === 'Any') return { status: 'none', rule: null }

  if (req === 'Citizen_or_Permanent_Resident') {
    return { status: status === 'other' ? 'fail' : 'pass', rule: 'Australian citizen or permanent resident' }
  }
  if (req === 'Citizen') {
    return { status: status === 'citizen' ? 'pass' : 'fail', rule: 'Australian citizen only — permanent residency is not enough' }
  }
  return { status: 'none', rule: null }
}

function ownerOccupierVerdict(scheme: LibraryScheme, willLiveIn: boolean): SimpleVerdict {
  if (scheme.owner_occupier_required !== 1) return { status: 'none', rule: null }
  const { occupancy_start_months: startWithin, min_occupancy_months: minMonths } = scheme
  const timing = startWithin && minMonths
    ? ` — move in within ${startWithin} months of settlement and live there continuously for at least ${minMonths} months`
    : ''
  return { status: willLiveIn ? 'pass' : 'fail', rule: `Must live in the property as your principal place of residence${timing}` }
}

/**
 * Scheme_ids requiring the applicant to buy as a natural person rather than
 * through a company or trust — read directly off each scheme's own
 * scheme_eligibility rows (no structured column backs this, unlike
 * residency_requirement etc., so it's a hand-verified list rather than a
 * runtime text match over free-form criteria).
 */
const REQUIRES_NATURAL_PERSON = new Set([
  'NSW_FHOG', 'NSW_FHBAS', 'NT_HGTG_EST', 'NT_HGTG_NEW', 'QLD_FHOG', 'VIC_FHOG', 'VIC_VHF', 'TAS_MYHOME',
])

function entityVerdict(scheme: LibraryScheme, purchasingEntity: PurchasingEntity): SimpleVerdict {
  if (!REQUIRES_NATURAL_PERSON.has(scheme.scheme_id)) return { status: 'none', rule: null }
  const rule = 'Must buy as an individual, not through a company or trust'
  return { status: purchasingEntity === 'individual' ? 'pass' : 'fail', rule }
}

/** Only the Family Home Guarantee gates on this — see the file header. */
const REQUIRES_SINGLE_PARENT = new Set(['FED_HGS_FHG_FAMILY'])

function singleParentVerdict(scheme: LibraryScheme, isSingleParent: boolean, buyingWithPartner: boolean): SimpleVerdict {
  if (!REQUIRES_SINGLE_PARENT.has(scheme.scheme_id)) return { status: 'none', rule: null }
  const rule = 'Must be a single legal guardian of at least one dependent child'
  return { status: isSingleParent && !buyingWithPartner ? 'pass' : 'fail', rule }
}

function combineStatus(
  typeOk: boolean,
  price: PriceCapVerdict,
  income: IncomeCapVerdict,
  priorOwnership: SimpleVerdict,
  citizenship: SimpleVerdict,
  ownerOccupier: SimpleVerdict,
  entity: SimpleVerdict,
  singleParent: SimpleVerdict,
): MatchStatus {
  if (!typeOk) return 'ineligible'
  const gates = [priorOwnership, citizenship, ownerOccupier, entity, singleParent]
  const hardFail = gates.some((v) => v.status === 'fail')
  if (hardFail || price.status === 'over' || income.status === 'over') return 'ineligible'
  const needsCheck = gates.some((v) => v.status === 'check')
  if (needsCheck || price.status === 'check' || income.status === 'check') return 'check'
  return 'eligible'
}

/**
 * Evaluate every Active/Expiring_Soon scheme in the library against one
 * applicant's inputs. Pure — same inputs always produce the same output.
 */
export function calculateSchemesLibrary(input: CalculatorInput): CalculatorResult {
  const candidates = SCHEMES.filter(
    (s) => (s.jurisdiction === 'Federal' || s.jurisdiction === input.state) && s.status !== 'Closed',
  )

  const purchasingEntity = input.purchasingEntity ?? 'individual'
  const isSingleParent = input.isSingleParent ?? false

  const matches: CalculatorMatch[] = candidates.map((scheme) => {
    const typeOk = PROPERTY_TYPE_TO_ELIGIBLE[input.propertyType](scheme.property_type_eligible ?? 'N/A')
    const priceCap = priceCapVerdict(scheme, input.state, input.propertyPrice, input.propertyType, input.locationType)
    const incomeCap = incomeCapVerdict(scheme, input.buyingWithPartner, input.income)
    const priorOwnership = priorOwnershipVerdict(scheme, input.everOwnedProperty, input.yearsSinceOwned)
    const citizenship = citizenshipVerdict(scheme, input.citizenshipStatus)
    const ownerOccupier = ownerOccupierVerdict(scheme, input.willLiveIn)
    const entity = entityVerdict(scheme, purchasingEntity)
    const singleParent = singleParentVerdict(scheme, isSingleParent, input.buyingWithPartner)
    const status = combineStatus(typeOk, priceCap, incomeCap, priorOwnership, citizenship, ownerOccupier, entity, singleParent)

    // Disqualifying (fail/over) reasons are pushed before merely-ambiguous
    // (check) ones, regardless of which verdict computed them first. When a
    // scheme is genuinely ineligible for one reason but also has an unrelated
    // "check" (e.g. absolute prior-ownership fail + no income supplied),
    // reasons[0] must be the real disqualifier — never a check-type reason
    // that reads as "just answer this and you're fine" on an ineligible card.
    const reasons: string[] = []
    if (!typeOk) reasons.push(`Not available for a ${PROPERTY_TYPE_LABEL[input.propertyType]} property under this scheme.`)
    if (priceCap.status === 'over') reasons.push(`Price exceeds the $${priceCap.applicableCap?.toLocaleString('en-AU')} cap for this scheme in ${input.state}.`)
    if (incomeCap.status === 'over') reasons.push(`Income exceeds the $${incomeCap.cap?.toLocaleString('en-AU')} ${incomeCap.applicantType?.toLowerCase()} cap.`)
    if (priorOwnership.status === 'fail') reasons.push(`You've owned property before, which doesn't meet this scheme's rule: "${priorOwnership.rule}"`)
    if (citizenship.status === 'fail') reasons.push(`Requires: ${citizenship.rule}.`)
    if (ownerOccupier.status === 'fail') reasons.push(ownerOccupier.rule ?? 'Requires owner-occupancy.')
    if (entity.status === 'fail') reasons.push(entity.rule ?? 'Must buy as an individual, not through a company or trust.')
    if (singleParent.status === 'fail') reasons.push(singleParent.rule ?? 'Only available to single parents or legal guardians of a dependent child.')
    if (priceCap.status === 'check') reasons.push(`Price is within the $${priceCap.highestRelevantCap?.toLocaleString('en-AU')} cap for some areas, but above $${priceCap.lowestRelevantCap?.toLocaleString('en-AU')} elsewhere — set capital city / regional above to check against the right one.`)
    if (incomeCap.status === 'check') reasons.push(`This scheme has a $${incomeCap.cap?.toLocaleString('en-AU')} ${incomeCap.applicantType?.toLowerCase()} income cap — enter your income to check against it.`)
    if (priorOwnership.status === 'check') reasons.push(`You've owned property before — this scheme has a time-limited lookback ("${priorOwnership.rule}"). Enter how many years ago to check against it.`)
    if (scheme.status === 'Expiring_Soon') reasons.push('This scheme is scheduled to change or close soon — confirm current terms before relying on it.')

    const toVerify = ELIGIBILITY.filter((e) => e.scheme_id === scheme.scheme_id).map((e) => ({
      text: e.criterion_description,
      mandatory: e.is_mandatory === 1,
    }))

    return { scheme, status, reasons, priceCap, incomeCap, priorOwnership, citizenship, ownerOccupier, entity, singleParent, toVerify }
  })

  matches.sort((a, b) => {
    const order: Record<MatchStatus, number> = { eligible: 0, check: 1, ineligible: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return (b.scheme.grant_amount_dollars ?? 0) - (a.scheme.grant_amount_dollars ?? 0)
  })

  const cashGrantsTotal = matches
    .filter((m) => m.status === 'eligible' && m.scheme.scheme_type === 'Grant')
    .reduce((sum, m) => sum + (m.scheme.grant_amount_dollars ?? 0), 0)

  return {
    matches,
    eligibleCount: matches.filter((m) => m.status === 'eligible').length,
    checkCount: matches.filter((m) => m.status === 'check').length,
    cashGrantsTotal,
  }
}
