/**
 * Sanitizer for AI-extracted questionnaire answers — the trust boundary
 * between model output and the Answers profile.
 *
 * The model only ever EXTRACTS; it never decides eligibility. Whatever JSON it
 * returns passes through here, and only values that survive strict validation
 * — known fields, exact enums, sane numeric ranges, suburbs that exist in the
 * dataset — reach the questionnaire. Everything else is silently dropped, so a
 * hallucinated field can never corrupt an application.
 *
 * Pure module: no Gemini import, fully unit-testable offline.
 */
import type { Answers, StateCode } from '@/lib/questionnaire/types'
import {
  CITIZENSHIP_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  BUYING_WITH_OPTIONS,
} from '@/lib/questionnaire/types'
import { SUBURBS, inferState } from '@/lib/questionnaire/postcodes'

/** The subset of Answers the extractor is allowed to fill. */
export type ExtractedFields = Partial<
  Pick<
    Answers,
    | 'name' | 'state' | 'suburb' | 'postcode'
    | 'price' | 'landPrice' | 'buildPrice' | 'deposit'
    | 'income' | 'coIncome'
    | 'propertyType' | 'ppr' | 'moveIn'
    | 'everOwned' | 'hasPartner' | 'partnerOwned' | 'priorBenefit'
    | 'buyingWith' | 'citizenship' | 'is18'
  >
>

const STATES: ReadonlySet<string> = new Set(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'])
const YES_NO: ReadonlySet<string> = new Set(['Yes', 'No'])

const MONEY_LIMITS: Record<string, [number, number]> = {
  price: [10_000, 20_000_000],
  landPrice: [10_000, 20_000_000],
  buildPrice: [10_000, 20_000_000],
  deposit: [0, 10_000_000],
  income: [0, 5_000_000],
  coIncome: [0, 5_000_000],
}

function money(v: unknown, field: keyof typeof MONEY_LIMITS): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : NaN
  if (!Number.isFinite(n)) return undefined
  const [lo, hi] = MONEY_LIMITS[field]
  return n >= lo && n <= hi ? Math.round(n) : undefined
}

function oneOf<T extends string>(v: unknown, options: ReadonlySet<string> | readonly T[]): T | undefined {
  if (typeof v !== 'string') return undefined
  const set = options instanceof Set ? options : new Set(options as readonly string[])
  return set.has(v) ? (v as T) : undefined
}

/**
 * Resolve a claimed suburb (and/or postcode) against the real dataset. Only an
 * exact, case-insensitive match may fill location fields — an invented suburb
 * resolves to nothing rather than something plausible.
 */
function resolveLocation(rawSuburb: unknown, rawPostcode: unknown, statedState: StateCode | undefined) {
  const postcode = typeof rawPostcode === 'string' && /^\d{4}$/.test(rawPostcode.trim()) ? rawPostcode.trim() : undefined
  const suburbText = typeof rawSuburb === 'string' ? rawSuburb.trim().toLowerCase() : ''

  if (suburbText) {
    const matches = SUBURBS.filter((s) => s.suburb.toLowerCase() === suburbText)
    // Disambiguate duplicate suburb names by postcode, then by stated state.
    const match =
      (postcode && matches.find((s) => s.postcode === postcode)) ||
      (statedState && matches.find((s) => s.state === statedState)) ||
      (matches.length === 1 ? matches[0] : undefined)
    if (match) return { suburb: match.suburb, postcode: match.postcode, state: match.state }
  }

  if (postcode) {
    const state = inferState(postcode)
    if (state) return { postcode, state }
  }
  return undefined
}

/** Validate raw model JSON down to safe questionnaire fields. */
export function sanitizeExtraction(raw: unknown): ExtractedFields {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const r = raw as Record<string, unknown>
  const out: ExtractedFields = {}

  if (typeof r.name === 'string' && r.name.trim() && r.name.trim().length <= 60) {
    out.name = r.name.trim()
  }

  const state = oneOf<StateCode>(r.state, STATES)
  if (state) out.state = state

  for (const f of ['price', 'landPrice', 'buildPrice', 'deposit', 'income', 'coIncome'] as const) {
    const n = money(r[f], f)
    if (n !== undefined) out[f] = n
  }

  const propertyType = oneOf(r.propertyType, PROPERTY_TYPE_OPTIONS)
  if (propertyType) out.propertyType = propertyType

  const citizenship = oneOf(r.citizenship, CITIZENSHIP_OPTIONS)
  if (citizenship) out.citizenship = citizenship

  const buyingWith = oneOf(r.buyingWith, BUYING_WITH_OPTIONS)
  if (buyingWith) out.buyingWith = buyingWith

  for (const f of ['ppr', 'moveIn', 'everOwned', 'hasPartner', 'partnerOwned', 'priorBenefit', 'is18'] as const) {
    const v = oneOf<'Yes' | 'No'>(r[f], YES_NO)
    if (v) out[f] = v
  }

  const loc = resolveLocation(r.suburb, r.postcode, out.state || undefined)
  if (loc) {
    if (loc.suburb) out.suburb = loc.suburb
    out.postcode = loc.postcode
    out.state = loc.state // postcode-derived state always wins — same rule as the combobox
  }

  // A partner mentioned as a co-buyer implies the partner questions apply.
  if (out.buyingWith === 'Jointly' && !out.hasPartner) out.hasPartner = 'Yes'

  return out
}

/** Human labels for the "here's what I filled in" chips. */
export const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  name: 'Name',
  state: 'State',
  suburb: 'Suburb',
  postcode: 'Postcode',
  price: 'Target price',
  landPrice: 'Land price',
  buildPrice: 'Build price',
  deposit: 'Deposit',
  income: 'Income',
  coIncome: 'Co-buyer income',
  propertyType: 'Property type',
  ppr: 'Living in it',
  moveIn: 'Move in on time',
  everOwned: 'Owned before',
  hasPartner: 'Has partner',
  partnerOwned: 'Partner owned before',
  priorBenefit: 'Prior grant received',
  buyingWith: 'Buying',
  citizenship: 'Citizenship',
  is18: '18 or older',
}

export function formatFieldValue(field: keyof ExtractedFields, value: unknown): string {
  if (typeof value === 'number') return `$${value.toLocaleString('en-AU')}`
  return String(value)
}
