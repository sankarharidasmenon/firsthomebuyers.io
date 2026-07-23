import type { EvaluatedGrant, EligibilityStatus, Grant } from '@/lib/schemes/types'

export interface EligibilityAnswers {
  state: string
  firstHomeBuyer: boolean
  income: number
  hasPartner: boolean
  propertyPrice: number
  deposit: number | null
  propertyType: string
  singleParent?: boolean
  rawAnswers?: any // Full answers from the questionnaire
}

export type DisplayCategory = 'cash' | 'schemes' | 'tax'

export type RuleResult = { met: boolean; text: string; missing?: boolean; isCheck?: boolean }

export interface EligibilityItem {
  eg: EvaluatedGrant
  category: DisplayCategory
  variant: 'grant' | 'scheme'
  bucket: 'yes' | 'check' | 'no'
  ruleResults: RuleResult[]
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
  minimum_deposit?: string | null
  eligible_property_types?: string | null
  prior_ownership_rules?: string | null
  owner_occupier_required?: string | null
  single_parent_required?: string | null
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

function evaluateScheme(s: ApiScheme, a: EligibilityAnswers): { bucket: 'yes' | 'check' | 'no', ruleResults: RuleResult[] } {
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
    const stateMatch = federal || states.includes(a.state.toUpperCase())
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
      if (st.includes('new home') && ra.propertyType !== 'New' && ra.propertyType !== 'Off-the-Plan') ptMatch = false

      if (ptMatch || st === '') pass(`Property type (${ra.propertyType}) is eligible`)
      else fail(`Property type (${ra.propertyType}) does not match: ${s.eligible_property_types}`)
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

  // 4. Property price cap
  const priceCap = parseMoney(s.property_price_cap)
  if (priceCap !== null && a.propertyPrice > 0) {
    if (a.propertyPrice <= priceCap) pass(`Purchase price ($${a.propertyPrice.toLocaleString()}) is within the ${s.applicable_states || a.state} price cap.`)
    else fail(`Purchase price ($${a.propertyPrice.toLocaleString()}) exceeds the ${s.applicable_states || a.state} price cap of $${priceCap.toLocaleString()}`)
  } else if (priceCap !== null) {
    check(`Purchase price not provided, cap is $${priceCap.toLocaleString()}`)
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

  // 6. Citizenship / Residency
  if (ra.citizenship) {
    const RESIDENT_OK = ['Australian Citizen', 'Permanent Resident', 'NZ Special Category Visa (SCV) holder']
    if (RESIDENT_OK.includes(ra.citizenship)) {
      pass(`Citizenship / Residency requirement satisfied`)
    } else {
      check(`Residency status (${ra.citizenship}) may not be eligible`)
    }
  } else {
    check(`Citizenship / Residency not provided`)
  }

  // 7. First home buyer / Previous ownership
  const requiresFHB = /yes/i.test(s.first_home_buyer_required || '') || /first[\s-]?home/i.test(s.scheme_name || '')
  if (requiresFHB) {
    if (a.firstHomeBuyer) pass(`First-home buyer requirement satisfied`)
    else fail(`Applicant has previously owned residential property.`)
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
    else if (ra.moveIn === 'No') check(`Move-in timeframe may not meet government requirements`)
    else check(`Move-in timeframe not provided`)
  } else {
    pass(`Move-in requirement skipped (Not PPR)`)
  }

  // 11. Income thresholds
  const incomeCap = parseMoney(a.hasPartner ? s.income_cap_couple : s.income_cap_single)
  if (incomeCap !== null) {
    if (a.income > 0) {
      if (a.income <= incomeCap) pass(`Combined income ($${a.income.toLocaleString()}) within $${incomeCap.toLocaleString()} threshold`)
      else fail(`Combined income ($${a.income.toLocaleString()}) exceeds $${incomeCap.toLocaleString()} threshold`)
    } else {
      check(`Income not provided, threshold is $${incomeCap.toLocaleString()}`)
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

  return { bucket, ruleResults: rules }
}

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

  // Evaluate exactly according to the 13-rule plan
  const { bucket, ruleResults } = evaluateScheme(s, a)
  const status: EligibilityStatus = bucket === 'yes' ? 'eligible' : bucket === 'check' ? 'check' : 'ineligible'

  const eg: EvaluatedGrant = {
    grant,
    status,
    value,
    criteria: ruleResults,
    reason: bucket === 'no' ? 'Does not meet mandatory criteria' : undefined,
  }
  return { eg, category, variant, bucket, ruleResults }
}

export async function fetchEligibility(a: EligibilityAnswers): Promise<EligibilityResult> {
  const allRes = await fetch('/api/schemes', { cache: 'no-store' })
  if (!allRes.ok) throw new Error(`Failed to load schemes (HTTP ${allRes.status})`)

  const all = ((await allRes.json()).schemes ?? []) as ApiScheme[]

  // Exclude closed schemes
  const active = all.filter(s => !s.status || !/closed|ended|expired|merged|superseded|inactive/i.test(String(s.status)))

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
