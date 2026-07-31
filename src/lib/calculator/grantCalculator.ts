/**
 * Grant Calculator engine — deliberately independent of the questionnaire.
 *
 * WHY THIS EXISTS SEPARATELY
 * The calculator used to POST to /api/eligibility, which runs the 16-rule
 * questionnaire engine. That engine emits a `check` for every question it has
 * no answer for — age, citizenship, owner-occupier intent — and a single
 * `check` downgrades a scheme out of the `eligible` bucket. The calculator only
 * ever collects three inputs, so every scheme came back `check` and the UI,
 * which renders `eligible` only, showed nothing.
 *
 * That is not a bug in the questionnaire engine: for a full questionnaire those
 * checks are correct. It is a mismatch of purpose. So the calculator gets its
 * own engine, scoped to exactly the three inputs it collects:
 *
 *   state · property type · property price
 *
 * A scheme is listed when it is open, available in the chosen state, fits the
 * chosen property type, and sits within the price cap. Nothing else is tested —
 * anything the calculator cannot know (income, age, residency, prior ownership)
 * is deliberately NOT used to exclude a scheme, because this is a "what might I
 * be able to claim" estimate, not an eligibility determination.
 *
 * DEPENDENCY POLICY
 * Imports here are one-way and read-only, and never reach the rule engine:
 *   - stampDuty.ts / priceCaps.ts — pure functions over master-data strings.
 * It must NOT import eligibilityClient.ts, applicantRules.ts, summary.ts or
 * anything under lib/questionnaire. Nothing in this file mutates shared state,
 * so it cannot affect questionnaire behaviour.
 */
import { firstHomeDuty, supportsDuty, type DutyOutcome } from '@/lib/schemes/stampDuty'
import { highestStateCap } from '@/lib/schemes/priceCaps'

/** The three inputs the calculator UI actually collects. */
export interface CalculatorInput {
  state: string
  propertyType: 'house' | 'townhouse' | 'apartment' | 'offplan'
  propertyPrice: number
}

/** Only the columns this engine reads. Read-only projection of a scheme row. */
export interface CalculatorScheme {
  scheme_id?: string | null
  scheme_name?: string | null
  type?: string | null
  benefit_type?: string | null
  benefit_value?: string | null
  short_description?: string | null
  status?: string | null
  official_url?: string | null
  applicable_states?: string | null
  eligible_property_types?: string | null
  new_vs_established?: string | null
  property_price_cap?: string | null
  price_cap_variations?: string | null
}

export type CalculatorLineKind = 'grant' | 'concession' | 'scheme'

export interface CalculatorLine {
  id: string
  name: string
  kind: CalculatorLineKind
  /** Dollar figure when the benefit is a fixed cash amount, else the published wording. */
  value: number | string
  officialUrl: string
}

export interface CalculatorResult {
  /** Fixed cash grants (FHOG and friends). */
  grants: CalculatorLine[]
  /** Duty concessions and non-cash schemes, in that order. */
  schemes: CalculatorLine[]
  /** Null when the state has no duty schedule implemented (currently TAS). */
  duty: DutyOutcome | null
  cashGrantsTotal: number
  stampDutySaving: number
  totalValue: number
}

const STATE_NAMES: Record<string, string> = {
  NSW: 'NEW SOUTH WALES',
  VIC: 'VICTORIA',
  QLD: 'QUEENSLAND',
  SA: 'SOUTH AUSTRALIA',
  WA: 'WESTERN AUSTRALIA',
  TAS: 'TASMANIA',
  ACT: 'AUSTRALIAN CAPITAL TERRITORY',
  NT: 'NORTHERN TERRITORY',
}

/** Local copy — see DEPENDENCY POLICY. Same intent as the questionnaire's, not shared. */
function isClosed(status: unknown): boolean {
  return /closed|ended|expired|merged|superseded|inactive/i.test(String(status ?? ''))
}

function parseMoney(v: unknown): number | null {
  if (!v) return null
  const n = Number(String(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Federal schemes count for every state; state schemes match on code or full name. */
function availableInState(s: CalculatorScheme, state: string): boolean {
  const states = String(s.applicable_states ?? '').toUpperCase()
  if (!states) return true
  if (/ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states)) return true
  const code = state.toUpperCase()
  // Word-boundary so "WA" cannot match inside "NEW SOUTH WALES".
  if (new RegExp(`\\b${code}\\b`).test(states)) return true
  const fullName = STATE_NAMES[code]
  return Boolean(fullName && states.includes(fullName))
}

/**
 * The dropdown mixes build status with dwelling shape, so each option is read
 * as both. "Existing House" pins build status to established (which is what
 * correctly drops the new-homes-only grants); townhouse and apartment leave it
 * open, because either can be bought new or established.
 */
function facets(propertyType: CalculatorInput['propertyType']): {
  build: 'new' | 'established' | 'any'
  dwelling: RegExp | null
} {
  switch (propertyType) {
    case 'offplan':
      return { build: 'new', dwelling: null }
    case 'house':
      return { build: 'established', dwelling: /\bhome\b|\bhouse\b|\bdwelling\b/ }
    case 'townhouse':
      return { build: 'any', dwelling: /townhouse|\bhome\b/ }
    case 'apartment':
      return { build: 'any', dwelling: /apartment|\bunit\b|\bflat\b/ }
  }
}

/**
 * Property-type fit, driven by the scheme's own `eligible_property_types`
 * tokens ("New home; Established home; Off-the-plan; Apartment/Unit; …").
 * An empty list means the scheme is not property-shaped at all (FHSS) and
 * always passes.
 */
function matchesPropertyType(s: CalculatorScheme, propertyType: CalculatorInput['propertyType']): boolean {
  const types = String(s.eligible_property_types ?? '').toLowerCase().trim()
  if (!types) return true

  const { build, dwelling } = facets(propertyType)

  const namesNew = /new home|off-the-plan|substantially renovated|house and land|kit home|owner builder/.test(types)
  const namesEstablished = /established home/.test(types)
  const namesDwelling = /new home|established home|apartment|unit|townhouse|flat|duplex|off-the-plan/.test(types)

  // A land-only program (QLD's vacant land concession lists only "Vacant land;
  // House and land"). The calculator has no vacant-land option, so it never
  // applies here.
  if (!namesDwelling) return false

  if (build === 'new' && !namesNew) return false
  if (build === 'established' && !namesEstablished) return false

  // `new_vs_established` is the authoritative restriction where it is stated.
  const nve = String(s.new_vs_established ?? '').toLowerCase()
  if (build === 'established' && /new\b[^.]*only/.test(nve)) return false

  if (dwelling && !dwelling.test(types)) return false
  return true
}

/**
 * Price-cap fit. The calculator does not know the suburb, so where a scheme
 * publishes several caps for one state the most generous is used — this reports
 * what could be available rather than hiding a scheme on an assumption. The
 * questionnaire, which can ask, resolves the same ambiguity to a "check".
 */
function withinPriceCap(s: CalculatorScheme, state: string, price: number): boolean {
  if (!(price > 0)) return true
  const cap = highestStateCap(s.price_cap_variations, state) ?? parseMoney(s.property_price_cap)
  if (cap === null) return true
  // "Less than $750,000" (QLD FHOG) excludes the cap itself.
  const exclusive = /less than/i.test(String(s.property_price_cap ?? ''))
  return exclusive ? price < cap : price <= cap
}

function kindOf(s: CalculatorScheme): CalculatorLineKind {
  const type = String(s.type ?? s.benefit_type ?? '')
  if (/grant/i.test(type)) return 'grant'
  if (/concession|stamp duty|duty relief/i.test(type)) return 'concession'
  return 'scheme'
}

/**
 * Evaluate every scheme against the calculator's three inputs.
 *
 * Pure: same inputs always produce the same result, and no argument is mutated.
 */
export function calculateGrants(schemes: CalculatorScheme[], input: CalculatorInput): CalculatorResult {
  const { state, propertyType, propertyPrice } = input

  const applicable = schemes.filter(
    (s) =>
      !isClosed(s.status) &&
      availableInState(s, state) &&
      matchesPropertyType(s, propertyType) &&
      withinPriceCap(s, state, propertyPrice),
  )

  const grants: CalculatorLine[] = []
  const schemeLines: CalculatorLine[] = []

  for (const s of applicable) {
    const kind = kindOf(s)
    const cash = kind === 'grant' ? parseMoney(s.benefit_value) : null
    const line: CalculatorLine = {
      id: String(s.scheme_id ?? s.scheme_name ?? ''),
      name: String(s.scheme_name ?? '').trim() || 'Government Scheme',
      kind,
      value: cash ?? String(s.benefit_value ?? '').trim(),
      officialUrl: String(s.official_url ?? '').trim(),
    }
    if (cash !== null) grants.push(line)
    else schemeLines.push(line)
  }

  // Concessions ahead of the remaining schemes so duty relief reads next to the
  // stamp duty figure it relates to.
  schemeLines.sort((a, b) => Number(b.kind === 'concession') - Number(a.kind === 'concession'))

  const duty = supportsDuty(state) && propertyPrice > 0 ? firstHomeDuty(state, propertyPrice) : null
  const stampDutySaving = duty?.calculable ? duty.saving ?? 0 : 0
  const cashGrantsTotal = grants.reduce((sum, g) => sum + (typeof g.value === 'number' ? g.value : 0), 0)

  return {
    grants,
    schemes: schemeLines,
    duty,
    cashGrantsTotal,
    stampDutySaving,
    totalValue: cashGrantsTotal + stampDutySaving,
  }
}
