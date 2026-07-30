/**
 * Summary figures for the results header and sidebar.
 *
 * PRESENTATION ONLY — this derives nothing new. It reads the same
 * `EligibilityItem[]` that renders the scheme cards below, so the summary and
 * the cards can never disagree. No scheme is re-evaluated and no rule lives here.
 *
 * The problem it solves: a benefit can be eligible without having a dollar
 * figure. The NSW, VIC and QLD duty concessions all carry the benefit value
 * "Duty exemption / concession", because the saving depends on a duty
 * calculation the questionnaire deliberately does not perform. Summing those
 * gave $0, and the UI then rendered "—" / "not eligible" beside a scheme card
 * that plainly said Eligible.
 *
 * So each category reports three things, and the UI can tell the difference
 * between "nothing eligible" and "eligible, amount not determinable".
 */
import type { DisplayCategory, EligibilityItem } from '@/lib/schemes/eligibilityClient'
import { firstHomeDuty, formatDuty, supportsDuty, type DutyOutcome } from '@/lib/schemes/stampDuty'

export interface CategorySummary {
  /** Sum of the eligible benefits that carry a dollar figure. */
  total: number
  /** Eligible benefits in this category. */
  eligibleCount: number
  /** Eligible benefits whose value is a dollar figure. */
  costedCount: number
  /** Eligible benefits with no dollar figure — a real benefit, amount unknown. */
  uncostedCount: number
}

export interface EligibilitySummary {
  cash: CategorySummary
  tax: CategorySummary
  schemes: CategorySummary
  /** Calculated duty outcome when a duty benefit is eligible, else null. */
  duty: DutyOutcome | null
  /** Cash + duty savings that could be costed. */
  totalBenefit: number
  /** Eligible benefits across all categories with no dollar figure. */
  totalUncosted: number
  /** Every eligible benefit, matching the cards below. */
  totalEligible: number
}

/** Money hidden in a benefit_value string, or null when there is no figure. */
function costOf(value: number | string): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  const n = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function summariseCategory(items: EligibilityItem[], category: DisplayCategory): CategorySummary {
  const eligible = items.filter((i) => i.category === category && i.bucket === 'yes')
  let total = 0
  let costedCount = 0
  for (const item of eligible) {
    const cost = costOf(item.eg.value)
    if (cost !== null) {
      total += cost
      costedCount++
    }
  }
  return {
    total,
    eligibleCount: eligible.length,
    costedCount,
    uncostedCount: eligible.length - costedCount,
  }
}

/**
 * Where the applicant is ELIGIBLE for a duty benefit, price the saving from the
 * official rate schedules instead of leaving it as unpriced text.
 *
 * Only runs when the rules engine already returned `yes` for a duty scheme — it
 * never changes eligibility, only puts a figure against it. If more than one
 * duty scheme is eligible the largest saving is used, since they are alternative
 * treatments of the same transaction rather than additive benefits.
 */
export function dutySavingFor(
  items: EligibilityItem[],
  state: string,
  price: number,
): DutyOutcome | null {
  if (!supportsDuty(state) || !Number.isFinite(price) || price <= 0) return null
  const eligibleDuty = items.filter((i) => i.category === 'tax' && i.bucket === 'yes')
  if (eligibleDuty.length === 0) return null
  return firstHomeDuty(state, price)
}

export function summariseEligibility(
  items: EligibilityItem[],
  context?: { state?: string; price?: number },
): EligibilitySummary {
  const cash = summariseCategory(items, 'cash')
  const tax = summariseCategory(items, 'tax')
  const schemes = summariseCategory(items, 'schemes')

  // Replace the unpriced duty benefit with the calculated saving when we can.
  const duty = context?.state && context?.price
    ? dutySavingFor(items, context.state, context.price)
    : null
  if (duty && duty.calculable && duty.saving !== null && duty.saving > 0) {
    tax.total = duty.saving
    tax.costedCount = tax.eligibleCount
    tax.uncostedCount = 0
  }

  return {
    cash,
    tax,
    schemes,
    duty,
    totalBenefit: cash.total + tax.total,
    totalUncosted: cash.uncostedCount + tax.uncostedCount + schemes.uncostedCount,
    totalEligible: items.filter((i) => i.bucket === 'yes').length,
  }
}

/**
 * What a category tile should show.
 *
 * `Available` is used where a benefit is eligible but its amount depends on a
 * calculation we do not perform — never "$0" and never "—", which both read as
 * "you don't qualify".
 */
export function categoryDisplay(
  c: CategorySummary,
  labels: { costed: string; uncosted: string; none: string },
): { value: string; note: string; muted: boolean } {
  if (c.total > 0) {
    const more = c.uncostedCount > 0 ? ` + ${c.uncostedCount} more` : ''
    return { value: `$${c.total.toLocaleString('en-AU')}${more}`, note: labels.costed, muted: false }
  }
  if (c.eligibleCount > 0) return { value: 'Available', note: labels.uncosted, muted: false }
  return { value: '—', note: labels.none, muted: true }
}

/**
 * The Tax & Duty Savings tile. Prefers the calculated saving; falls back to
 * "Check Required" when a duty benefit is eligible but the published schedule
 * gives no formula — never a fabricated figure.
 */
export function taxDisplay(s: EligibilitySummary): { value: string; note: string; muted: boolean } {
  if (s.duty && s.duty.calculable && s.duty.saving !== null && s.duty.saving > 0) {
    return { value: `$${formatDuty(s.duty.saving)}`, note: 'stamp duty saved', muted: false }
  }
  if (s.duty && !s.duty.calculable) {
    return { value: 'Check Required', note: 'needs the official calculator', muted: false }
  }
  if (s.duty && s.duty.saving === 0) {
    return { value: '$0', note: 'no duty saving at this price', muted: true }
  }
  return categoryDisplay(s.tax, {
    costed: 'stamp duty reduction',
    uncosted: 'duty exemption or concession',
    none: 'not eligible',
  })
}

/** What the Total Benefit row should show. */
export function totalBenefitDisplay(s: EligibilitySummary): { value: string; note: string } {
  if (s.totalBenefit > 0) {
    return {
      value: `$${s.totalBenefit.toLocaleString('en-AU')}${s.totalUncosted > 0 ? '+' : ''}`,
      note: s.totalUncosted > 0 ? `plus ${s.totalUncosted} benefit${s.totalUncosted === 1 ? '' : 's'} we can't price yet` : '',
    }
  }
  if (s.totalEligible > 0) {
    return { value: 'Available', note: 'amount depends on a duty calculation' }
  }
  return { value: '—', note: '' }
}
