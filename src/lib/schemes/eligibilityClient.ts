/**
 * Client-side eligibility data source (Phase 2B-3).
 *
 * Replaces the hardcoded evaluateEligibility()/GRANTS_DUMMY path on the grants
 * results page. Eligibility is decided entirely by the database via the Phase 2A
 * read APIs:
 *   - GET /api/schemes            → all schemes (for the eligible/ineligible split)
 *   - GET /api/schemes/eligible   → the schemes the user qualifies for
 *
 * The API result is mapped into the SAME shapes the existing UI (GrantCard,
 * TotalSavingsHero) already consumes, so no component is redesigned.
 */
import type { EvaluatedGrant, EligibilityStatus, Grant } from '@/lib/schemes/types'

export interface EligibilityAnswers {
  state: string
  firstHomeBuyer: boolean
  income: number
  hasPartner: boolean
  propertyPrice: number
  deposit: number
  propertyType: string
  singleParent?: boolean
}

export type DisplayCategory = 'cash' | 'schemes' | 'tax'

export interface EligibilityItem {
  eg: EvaluatedGrant
  category: DisplayCategory
  variant: 'grant' | 'scheme'
}

export interface EligibilityResult {
  items: EligibilityItem[]
  cashGrantsTotal: number
  taxSavingsTotal: number
  eligibleSchemesCount: number
  totalEligibleCount: number
}

interface ApiScheme {
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

function buildCriteria(s: ApiScheme, a: EligibilityAnswers): EvaluatedGrant['criteria'] {
  const criteria: EvaluatedGrant['criteria'] = []
  if (s.status) criteria.push({ text: `Program status: ${s.status}`, met: true })
  if (s.benefit_value) criteria.push({ text: `Benefit: ${s.benefit_value}`, met: true })
  if (s.applicable_states) {
    const states = String(s.applicable_states).toUpperCase()
    const federal = /ALL STATES|ALL TERRITORIES|AUSTRALIA/.test(states)
    criteria.push({ text: `Applies to: ${s.applicable_states}`, met: federal || states.includes(a.state.toUpperCase()) })
  }
  if (/yes/i.test(String(s.first_home_buyer_required || ''))) {
    criteria.push({ text: 'First home buyer required', met: a.firstHomeBuyer })
  }
  const incomeCap = parseMoney(a.hasPartner ? s.income_cap_couple : s.income_cap_single)
  if (incomeCap !== null) {
    criteria.push({ text: `Income under $${incomeCap.toLocaleString('en-AU')}`, met: a.income <= incomeCap })
  }
  const priceCap = parseMoney(s.property_price_cap)
  if (priceCap !== null) {
    criteria.push({ text: `Property price under $${priceCap.toLocaleString('en-AU')}`, met: a.propertyPrice <= priceCap })
  }
  if (criteria.length === 0) criteria.push({ text: 'Check official eligibility criteria', met: true })
  return criteria
}

function toItem(s: ApiScheme, eligible: boolean, a: EligibilityAnswers): EligibilityItem {
  const category = deriveCategory(String(s.type || s.benefit_type || ''))
  const variant: 'grant' | 'scheme' = category === 'cash' ? 'grant' : 'scheme'
  const status: EligibilityStatus = eligible ? 'eligible' : 'ineligible'

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

  const eg: EvaluatedGrant = {
    grant,
    status,
    value,
    criteria: buildCriteria(s, a),
    reason: eligible ? undefined : "Based on your answers, you don't currently meet the eligibility criteria for this scheme.",
  }
  return { eg, category, variant }
}

/** Fetch eligibility from the database and map it into the UI's shapes. */
export async function fetchEligibility(a: EligibilityAnswers): Promise<EligibilityResult> {
  const params = new URLSearchParams({
    state: a.state,
    firstHomeBuyer: String(a.firstHomeBuyer),
    income: String(a.income),
    hasPartner: String(a.hasPartner),
    propertyPrice: String(a.propertyPrice),
    propertyType: a.propertyType,
    deposit: String(a.deposit),
  })
  if (a.singleParent !== undefined) params.set('singleParent', String(a.singleParent))

  const [allRes, eligRes] = await Promise.all([
    fetch('/api/schemes', { cache: 'no-store' }),
    fetch(`/api/schemes/eligible?${params.toString()}`, { cache: 'no-store' }),
  ])
  if (!allRes.ok) throw new Error(`Failed to load schemes (HTTP ${allRes.status})`)
  if (!eligRes.ok) throw new Error(`Failed to load eligibility (HTTP ${eligRes.status})`)

  const all = ((await allRes.json()).schemes ?? []) as ApiScheme[]
  const eligible = ((await eligRes.json()).schemes ?? []) as ApiScheme[]
  const eligibleIds = new Set(eligible.map((s) => s.scheme_id))

  const items = all.map((s) => toItem(s, eligibleIds.has(s.scheme_id), a))

  const sumEligible = (cat: DisplayCategory) =>
    items
      .filter((i) => i.category === cat && i.eg.status === 'eligible')
      .reduce((sum, i) => sum + (typeof i.eg.value === 'number' ? i.eg.value : parseMoney(i.eg.value) ?? 0), 0)

  return {
    items,
    cashGrantsTotal: sumEligible('cash'),
    taxSavingsTotal: sumEligible('tax'),
    eligibleSchemesCount: items.filter((i) => i.category === 'schemes' && i.eg.status === 'eligible').length,
    totalEligibleCount: items.filter((i) => i.eg.status === 'eligible').length,
  }
}
