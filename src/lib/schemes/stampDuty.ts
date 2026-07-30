/**
 * Transfer / land transfer (stamp) duty calculator — NSW, VIC, QLD and SA.
 *
 * Pure arithmetic over the published rate schedules. It contains no eligibility
 * logic: callers pass a price and a state, and separately decide (from the rules
 * engine) whether the applicant qualifies for the first home benefit. The
 * summary card and the scheme card both call this, so they cannot disagree.
 *
 * Sources — official rate schedules only:
 *   NSW general        Revenue NSW, "How to calculate transfer duty", 2026/27
 *                      https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty
 *   NSW FHBAS          Exempt to $800,000; concessional rate $800,001–$999,999
 *                      https://www.revenue.nsw.gov.au/grants-schemes/assistance-scheme
 *   VIC PPR rates      SRO Vic, principal place of residence current rates
 *                      https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-principal-place-residence-current-rates
 *   VIC general rates  SRO Vic, non-principal place of residence current rates
 *                      https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-non-principal-place-residence-current-rates
 *   QLD general        QRO, transfer duty rates
 *                      https://qro.qld.gov.au/duties/transfer-duty/rates/
 *   QLD home + first   QRO, concession rates (home concession table and the
 *   home concession    first home concession rebate table from 9 June 2024)
 *                      https://qro.qld.gov.au/duties/transfer-duty/calculate/concession-rates/
 *   SA general         RevenueSA, "Rate of stamp duty" (conveyance rates)
 *                      https://www.revenuesa.sa.gov.au/stampduty/rate-of-stamp-duty
 *   SA first home      RevenueSA, stamp duty relief for eligible first home
 *   relief             buyers — full relief, no value cap, contracts from
 *                      6 June 2024
 *                      https://www.revenuesa.sa.gov.au/stampduty/first-home-buyer-relief/relief-available
 *   ACT owner-occupier ACT Revenue Office, conveyance duty for non-commercial
 *                      property — eligible owner occupier table, from 1 July 2025
 *                      https://www.revenue.act.gov.au/rates-and-property-charges/conveyance-duty-stamp-duty/conveyance-duty-for-non-commercial-property
 *   ACT Home Buyer     ACT Revenue Office, Home Buyer Concession Scheme — nil
 *   Concession         duty, no property value limit, transactions from
 *                      1 July 2026
 *                      https://www.revenue.act.gov.au/home-buyer-assistance/home-buyer-concession-scheme/about-the-home-buyer-concession-scheme
 *   WA general         RevenueWA, "Duties Fact Sheet - Residential Land",
 *                      general rate (identical to the residential rate since
 *                      1 July 2022)
 *                      https://www.wa.gov.au/government/publications/duties-fact-sheet-residential-land
 *   WA FHOR            RevenueWA, first home owner rate of duty — nil to
 *                      $600,000, concessional $600,001–$800,000, from
 *                      7 May 2026
 *                      https://www.wa.gov.au/government/publications/duties-fact-sheet-first-home-owner-rate
 *   NT conveyance      Stamp Duty Act 1978 (NT), Schedule 1 clause 1(2), as in
 *                      force at 1 July 2025 — the primary legislation, not a
 *                      summary page
 *                      https://legislation.nt.gov.au/en/Legislation/STAMP-DUTY-ACT-1978
 *   NT HLPE            NT Government, House and Land Package Exemption — full
 *                      exemption, no value cap, contracts to 30 June 2027
 *                      https://nt.gov.au/property/home-owner-assistance/stamp-duty-exemption
 */

export type DutyState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'ACT' | 'WA' | 'NT'

/** One row of a rate schedule: duty = base + rate × (value − threshold). */
interface Bracket {
  /** Applies when value is greater than this. */
  threshold: number
  /** Fixed component at the threshold. */
  base: number
  /** Marginal rate as a decimal (0.045 = $4.50 per $100). */
  rate: number
}

/** Highest applicable bracket first. */
function dutyFromBrackets(value: number, brackets: Bracket[]): number {
  for (const b of brackets) {
    if (value > b.threshold) return b.base + b.rate * (value - b.threshold)
  }
  return 0
}

/**
 * Queensland and South Australia both charge "for each $100, OR PART OF $100"
 * over the threshold, so the excess is rounded UP to the next whole $100 before
 * the rate is applied. NSW ("for every $100") and Victoria (a percentage of the
 * dutiable value) do not work this way, which is why this is a separate function
 * rather than a change to `dutyFromBrackets`.
 *
 * The difference is at most $5.49 and only shows on a price that is not a
 * multiple of $100 — QRO's and RevenueSA's own worked examples ($730,000,
 * $670,000, $420,000) are round numbers and so cannot distinguish the two
 * methods.
 */
function dutyPerHundredOrPart(value: number, brackets: Bracket[]): number {
  for (const b of brackets) {
    if (value > b.threshold) {
      const hundreds = Math.ceil((value - b.threshold) / 100)
      return b.base + b.rate * 100 * hundreds
    }
  }
  return 0
}

/** Queensland and SA duty carry cents; keep them rather than rounding to dollars. */
function cents(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * A duty amount without the `$` — cents only when there are cents, so NSW and
 * VIC keep reading "$30,187" while QLD can show "$4.50" instead of "$4.5".
 */
export function formatDuty(n: number): string {
  const hasCents = Math.round(n * 100) % 100 !== 0
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

/* ── NSW general transfer duty, 2026/27 ─────────────────────────────────── */
const NSW_GENERAL: Bracket[] = [
  { threshold: 1290000, base: 52237, rate: 0.055 },
  { threshold: 387000, base: 11602, rate: 0.045 },
  { threshold: 103000, base: 1662, rate: 0.035 },
  { threshold: 38000, base: 525, rate: 0.0175 },
  { threshold: 18000, base: 225, rate: 0.015 },
  { threshold: 0, base: 0, rate: 0.0125 },
]

/* ── VIC land transfer duty (contracts on or after 1 July 2021) ─────────── */
const VIC_PPR: Bracket[] = [
  { threshold: 440000, base: 18370, rate: 0.06 },
  { threshold: 130000, base: 2870, rate: 0.05 },
  { threshold: 25000, base: 350, rate: 0.024 },
  { threshold: 0, base: 0, rate: 0.014 },
]
const VIC_GENERAL: Bracket[] = [
  { threshold: 2000000, base: 110000, rate: 0.065 },
  { threshold: 130000, base: 2870, rate: 0.06 },
  { threshold: 25000, base: 350, rate: 0.024 },
  { threshold: 0, base: 0, rate: 0.014 },
]
/** The PPR concessional scale is only available up to $550,000. */
const VIC_PPR_LIMIT = 550000
/** $960,001–$2,000,000 is a flat 5.5% of the whole dutiable value. */
const VIC_FLAT_BAND = { from: 960000, to: 2000000, rate: 0.055 }

/* ── QLD transfer duty ───────────────────────────────────────────────────── */
const QLD_GENERAL: Bracket[] = [
  { threshold: 1000000, base: 38025, rate: 0.0575 },
  { threshold: 540000, base: 17325, rate: 0.045 },
  { threshold: 75000, base: 1050, rate: 0.035 },
  { threshold: 5000, base: 0, rate: 0.015 },
  { threshold: 0, base: 0, rate: 0 },
]
const QLD_HOME: Bracket[] = [
  { threshold: 1000000, base: 30850, rate: 0.0575 },
  { threshold: 540000, base: 10150, rate: 0.045 },
  { threshold: 350000, base: 3500, rate: 0.035 },
  { threshold: 0, base: 0, rate: 0.01 },
]
/**
 * QLD first home concession rebate, contracts on or after 9 June 2024. Full
 * concession below $700,000; then a stepped rebate in $10,000 bands to nil at
 * $800,000. Applied on top of the home concession.
 */
/** At and above this value the first home rebate is nil — home concession only. */
const QLD_FIRST_HOME_REBATE_CEILING = 800000
const QLD_FIRST_HOME_REBATE: { from: number; amount: number }[] = [
  { from: 790000, amount: 1735 },
  { from: 780000, amount: 3470 },
  { from: 770000, amount: 5205 },
  { from: 760000, amount: 6940 },
  { from: 750000, amount: 8675 },
  { from: 740000, amount: 10410 },
  { from: 730000, amount: 12145 },
  { from: 720000, amount: 13880 },
  { from: 710000, amount: 15615 },
  { from: 700000, amount: 17350 },
]

/* ── SA conveyance duty ──────────────────────────────────────────────────── */
/**
 * RevenueSA publishes a single conveyance scale — South Australia has no
 * separate owner-occupier or "home" scale the way Queensland does, so this one
 * table is both the standard duty and the duty a first home buyer would pay
 * without relief. Rates are "$X for every $100 or part of $100" over the
 * threshold, hence `dutyPerHundredOrPart`.
 */
const SA_GENERAL: Bracket[] = [
  { threshold: 500000, base: 21330, rate: 0.055 },
  { threshold: 300000, base: 11330, rate: 0.05 },
  { threshold: 250000, base: 8955, rate: 0.0475 },
  { threshold: 200000, base: 6830, rate: 0.0425 },
  { threshold: 100000, base: 2830, rate: 0.04 },
  { threshold: 50000, base: 1080, rate: 0.035 },
  { threshold: 30000, base: 480, rate: 0.03 },
  { threshold: 12000, base: 120, rate: 0.02 },
  { threshold: 0, base: 0, rate: 0.01 },
]

/**
 * South Australia abolished the property value cap on first home buyer stamp
 * duty relief for contracts entered into on or after 6 June 2024: relief is FULL
 * at every price, so there is no threshold and no taper to model. The tapered
 * $650,000–$700,000 (new home) and $400,000–$450,000 (vacant land) bands applied
 * only to contracts dated 15 June 2023 – 5 June 2024 and are not offered to a
 * buyer signing today, so they are deliberately not implemented here.
 */
const SA_RELIEF_FROM = '6 June 2024'

/* ── ACT conveyance duty ─────────────────────────────────────────────────── */
/**
 * The ACT publishes TWO non-commercial scales: a lower one for an "eligible
 * owner occupier transaction" and a higher one for everything else. A Home Buyer
 * Concession claimant must live in the home for a continuous year, which is
 * exactly what makes a transaction an eligible owner-occupier one — so the
 * owner-occupier scale is the correct counterfactual for "what they would
 * otherwise have paid", and the higher scale is deliberately not modelled here.
 *
 * Rates are "per $100, or part thereof", so the same rounding as QLD and SA.
 * Unchanged from 1 July 2025 through the 2026-27 year.
 */
const ACT_OWNER_OCCUPIER: Bracket[] = [
  { threshold: 1000000, base: 33958, rate: 0.064 },
  { threshold: 750000, base: 19208, rate: 0.059 },
  { threshold: 500000, base: 8408, rate: 0.0432 },
  { threshold: 300000, base: 1608, rate: 0.034 },
  { threshold: 260000, base: 728, rate: 0.022 },
  { threshold: 0, base: 0, rate: 0.0028 },
]

/**
 * Above $1,455,000 the ACT abandons the marginal scale entirely and charges a
 * FLAT $4.54 per $100 on the whole dutiable value — not on the excess. That is a
 * step up, not a continuation: $1,455,000 attracts $63,078 on the scale while a
 * dollar more attracts about $66,057 flat.
 *
 * The flat band does NOT round up to the next $100. Every one of the six
 * marginal rows in the determination says "for every $100, OR PART OF $100";
 * the flat row deliberately does not — it reads "a flat rate of $4.54 per $100
 * applied to the total dutiable amount". The omission is consistent across the
 * instrument and the published rate table, so the excess is not rounded here.
 * Source: Taxation Administration (Amounts Payable—Duty) Determination 2026
 * (DI2026-155), Schedule 1 / Table 1, commenced 1 July 2026.
 */
const ACT_FLAT_FROM = 1455000
const ACT_FLAT_RATE = 0.0454

function actDuty(value: number): number {
  if (value > ACT_FLAT_FROM) return cents(ACT_FLAT_RATE * value)
  return cents(dutyPerHundredOrPart(value, ACT_OWNER_OCCUPIER))
}

/**
 * The ACT Home Buyer Concession Scheme removed BOTH the income threshold and the
 * property value cap for transactions from 1 July 2026, so an eligible buyer
 * pays nil duty at any price — on a home or on vacant land. Like South Australia
 * and unlike NSW, VIC and QLD, there is no threshold or taper to model. The
 * $1,020,000 cap and $35,238 concession ceiling applied to transactions dated
 * 1 July 2025 – 30 June 2026 and are not offered to a buyer signing today.
 */
const ACT_HBC_FROM = '1 July 2026'

/* ── WA transfer duty ────────────────────────────────────────────────────── */
/**
 * Western Australia's general rate. Since 1 July 2022 the general rate and the
 * old residential rate are identical — RevenueWA states that outright — so this
 * one table is the correct baseline for a first home buyer.
 *
 * Rates are "per $100 or part thereof", the same rounding as QLD, SA and ACT.
 *
 * Cross-checked against two historical first home owner rate periods, where the
 * FHOR taper was set to meet the general rate exactly at its cap:
 *   Metro/Peel to 6 May 2026:  $13.63 × 2,000 = $27,260 vs general $27,265 at $700,000
 *   Regional  to 6 May 2026:   $11.89 × 2,500 = $29,725 vs general $29,740.50 at $750,000
 * Both land within rounding, which validates this table independently.
 */
const WA_GENERAL: Bracket[] = [
  { threshold: 725000, base: 28453, rate: 0.0515 },
  { threshold: 360000, base: 11115, rate: 0.0475 },
  { threshold: 150000, base: 3135, rate: 0.038 },
  { threshold: 120000, base: 2280, rate: 0.0285 },
  { threshold: 0, base: 0, rate: 0.019 },
]

/**
 * First home owner rate of duty, transactions entered into on or after
 * 7 May 2026: nil duty to $600,000, then $16.15 for every $100, or part of $100,
 * above $600,000, up to the $800,000 cap.
 *
 * The rate is $16.15, NOT the $20.14 printed in RevenueWA's "Duties Fact Sheet -
 * First Home Owner Rate". Two official sources conflict, and three independent
 * lines of evidence resolve it:
 *
 *  1. RevenueWA Circular 23, "Finance Legislation Amendment (Housing
 *     Affordability) Bill 2026" — the circular explaining the amending
 *     legislation — states $16.15 for homes above $600,000 and $20.14 for vacant
 *     land above $450,000. The fact sheet prints those two figures the other way
 *     round, i.e. transposed.
 *  2. Arithmetic. WA sets the taper so FHOR duty meets the GENERAL rate exactly
 *     at the cap, as both earlier FHOR periods did. With the circular's
 *     assignment: homes $16.15 × 2,000 = $32,300 vs general $32,315.50 at
 *     $800,000 (−$15.50, the same rounding delta the 2025 regional band showed);
 *     vacant land $20.14 × 1,000 = $20,140 vs general $20,140 at $550,000 — an
 *     EXACT match. With the fact sheet's assignment, homes would cost $40,280 at
 *     $800,000 against a general rate of $32,315.50 — a "concession" $7,964 worse
 *     than paying full duty, which cannot be the intent.
 *  3. The rate needed for homes to meet the general rate at $800,000 is
 *     $16.1578 per $100, which rounds to the circular's $16.15.
 *
 * Vacant land keeps its own thresholds ($450,000 / $550,000 at $20.14). The
 * questionnaire cannot distinguish vacant land from a home purchase, so those
 * are recorded in the scheme data rather than modelled here.
 */
const WA_FHOR_EXEMPT_TO = 600000
const WA_FHOR_CAP = 800000
const WA_FHOR_RATE_PER_100 = 16.15

/* ── NT conveyance duty ──────────────────────────────────────────────────── */
/**
 * The Northern Territory is the only jurisdiction here that does not use a
 * bracket table. Stamp Duty Act 1978 (NT), Schedule 1 clause 1(2), quoted
 * verbatim from the consolidated Act as in force at 1 July 2025:
 *
 *   (a) if the dutiable value … does not exceed $525 000:
 *         D = (0.06571441 x V2) + 15V
 *       where D is the duty (expressed in dollars) and
 *             V is 1/1 000 of the dutiable value (expressed in dollars)
 *   (b) if the dutiable value exceeds $525 000 but is less than $3 000 000,
 *       the duty is 4.95% of the dutiable value;
 *   (c) if the dutiable value is $3 000 000 or more but is less than
 *       $5 000 000, the duty is 5.75% of the dutiable value;
 *   (d) if the dutiable value is $5 000 000 or more, the duty is 5.95%
 *       of the dutiable value.
 *
 * The quadratic is calibrated to meet the 4.95% flat rate at its ceiling: at
 * $525,000 the formula gives $25,987.60 against 4.95% of $525,000 = $25,987.50,
 * a 10 cent difference. That near-continuity is a useful check that the
 * coefficients are transcribed correctly.
 *
 * Note the percentages above $3,000,000 are flat rates on the WHOLE dutiable
 * value, so each band boundary is a genuine step, not a taper.
 */
const NT_FORMULA_CEILING = 525000
const NT_QUADRATIC_A = 0.06571441
const NT_QUADRATIC_B = 15
const NT_FLAT_BANDS: { from: number; rate: number }[] = [
  { from: 5000000, rate: 0.0595 },
  { from: 3000000, rate: 0.0575 },
  { from: 0, rate: 0.0495 },
]

function ntDuty(value: number): number {
  if (value <= NT_FORMULA_CEILING) {
    const v = value / 1000
    return cents(NT_QUADRATIC_A * v * v + NT_QUADRATIC_B * v)
  }
  const band = NT_FLAT_BANDS.find((b) => value >= b.from)!
  return cents(band.rate * value)
}
export function standardDuty(state: DutyState, value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  switch (state) {
    case 'NSW':
      return round(dutyFromBrackets(value, NSW_GENERAL))
    case 'VIC':
      return round(victoriaDuty(value))
    case 'QLD':
      return cents(dutyPerHundredOrPart(value, QLD_GENERAL))
    case 'SA':
      return cents(dutyPerHundredOrPart(value, SA_GENERAL))
    case 'ACT':
      return actDuty(value)
    case 'WA':
      return cents(dutyPerHundredOrPart(value, WA_GENERAL))
    case 'NT':
      return ntDuty(value)
  }
}

function victoriaDuty(value: number): number {
  // A principal place of residence uses the concessional PPR scale up to
  // $550,000; above that the general scale applies.
  if (value <= VIC_PPR_LIMIT) return dutyFromBrackets(value, VIC_PPR)
  if (value > VIC_FLAT_BAND.from && value <= VIC_FLAT_BAND.to) return value * VIC_FLAT_BAND.rate
  return dutyFromBrackets(value, VIC_GENERAL)
}

export interface DutyOutcome {
  state: DutyState
  price: number
  /** Duty with no first home benefit. */
  standard: number
  /** Duty after the first home exemption or concession. Null when not calculable. */
  payable: number | null
  /** standard − payable. Null when not calculable. */
  saving: number | null
  /** True when every figure above is a real calculated number. */
  calculable: boolean
  /** Plain-English description of the outcome, or why it can't be calculated. */
  note: string
}

/**
 * Duty for a first home buyer who the rules engine has already found ELIGIBLE
 * for that state's first home duty benefit.
 *
 * Never guesses: where the published schedule does not give a formula this
 * returns `calculable: false` so the caller can show "Check Required" instead of
 * a fabricated number.
 */
export function firstHomeDuty(state: DutyState, price: number): DutyOutcome {
  const standard = standardDuty(state, price)
  const base = { state, price, standard, calculable: true as boolean }

  if (state === 'NSW') {
    if (price <= 800000) {
      return { ...base, payable: 0, saving: standard, note: 'Full exemption — no transfer duty payable up to $800,000.' }
    }
    if (price < 1000000) {
      // Revenue NSW publishes a concessional rate for $800,001–$999,999 but not
      // the formula behind it; the FHBAS calculator is the authority. Rather
      // than approximate it, report that it needs the official calculator.
      return {
        ...base, payable: null, saving: null, calculable: false,
        note: 'A concessional rate applies between $800,000 and $1,000,000. Confirm the exact amount with the Revenue NSW FHBAS calculator.',
      }
    }
    return { ...base, payable: standard, saving: 0, note: 'No first home duty benefit at $1,000,000 or above.' }
  }

  if (state === 'VIC') {
    if (price <= 600000) {
      return { ...base, payable: 0, saving: standard, note: 'Full exemption — no land transfer duty payable up to $600,000.' }
    }
    if (price <= 750000) {
      // The concession tapers linearly: duty is the full amount scaled by how
      // far the price sits through the $600,000–$750,000 band, reaching full
      // duty at $750,000.
      const payable = round(standard * ((price - 600000) / 150000))
      return { ...base, payable, saving: round(standard - payable), note: 'Tapered concession — duty phases in between $600,001 and $750,000.' }
    }
    return { ...base, payable: standard, saving: 0, note: 'No first home duty benefit above $750,000.' }
  }

  if (state === 'SA') {
    // Full relief at any price — the value cap was abolished on 6 June 2024, so
    // unlike NSW, VIC and QLD there is no threshold, taper or ceiling.
    return {
      ...base,
      payable: 0,
      saving: standard,
      note: `Full stamp duty relief — no stamp duty payable at any property value for contracts entered into on or after ${SA_RELIEF_FROM}.`,
    }
  }

  if (state === 'ACT') {
    // Full concession at any price — the property value limit and the income
    // threshold were both removed on 1 July 2026.
    return {
      ...base,
      payable: 0,
      saving: standard,
      note: `Full home buyer concession — no conveyance duty payable at any property value for transactions dated on or after ${ACT_HBC_FROM}.`,
    }
  }

  if (state === 'WA') {
    if (price <= WA_FHOR_EXEMPT_TO) {
      return {
        ...base, payable: 0, saving: standard,
        note: 'Full first home owner rate — no transfer duty payable up to $600,000 for transactions entered into on or after 7 May 2026.',
      }
    }
    if (price <= WA_FHOR_CAP) {
      // "$16.15 for every $100, OR PART OF $100, by which it exceeds $600,000" —
      // so the excess rounds up to the next whole $100 before the rate applies.
      const hundreds = Math.ceil((price - WA_FHOR_EXEMPT_TO) / 100)
      // Never charge more than the general rate: a concession cannot cost more
      // than not having it. The published rate does not breach this, but the
      // guard makes that impossible rather than merely true today.
      const payable = Math.min(cents(WA_FHOR_RATE_PER_100 * hundreds), standard)
      return {
        ...base, payable, saving: cents(standard - payable),
        note: `Concessional first home owner rate — $${WA_FHOR_RATE_PER_100.toFixed(2)} for every $100, or part of $100, above $600,000, leaving $${formatDuty(payable)} of duty payable. The concession tapers to nil at the $800,000 cap.`,
      }
    }
    return { ...base, payable: standard, saving: 0, note: 'No first home owner rate of duty at $800,000 or above.' }
  }

  if (state === 'NT') {
    // The House and Land Package Exemption removes duty entirely, with no cap on
    // the value of the property, for contracts signed to 30 June 2027. The
    // caller only reaches this branch when the rules engine has already found an
    // NT duty scheme eligible, and HLPE is the Territory's only one.
    return {
      ...base,
      payable: 0,
      saving: standard,
      note: 'Full House and Land Package Exemption — no stamp duty payable at any property value, for contracts signed by 30 June 2027.',
    }
  }

  // QLD — home concession, then the first home concession rebate on top.
  const homeConcessionDuty = cents(dutyPerHundredOrPart(price, QLD_HOME))
  const rebate = price < QLD_FIRST_HOME_REBATE_CEILING
    ? QLD_FIRST_HOME_REBATE.find((b) => price >= b.from)
    : undefined
  if (price < 700000) {
    return { ...base, payable: 0, saving: standard, note: 'Full first home concession — no transfer duty payable below $700,000.' }
  }
  if (rebate) {
    const payable = Math.max(0, cents(homeConcessionDuty - rebate.amount))
    // Above $700,000 the concession is the sliding scale, not the full one — even
    // where the rebate happens to cover the duty entirely at the bottom of a
    // band. Say so, so the card never implies the "no duty up to $700,000" rule
    // is what is being applied.
    const note = payable > 0
      ? `Sliding-scale first home concession — a $${formatDuty(rebate.amount)} rebate applies, leaving $${formatDuty(payable)} of duty payable. Duty increases as the price rises through this band.`
      : `Sliding-scale first home concession — the $${formatDuty(rebate.amount)} rebate covers the duty in full at this price. Duty increases as the price rises through this band.`
    return { ...base, payable, saving: cents(standard - payable), note }
  }
  // $800,000+: home concession only, no first home rebate.
  return { ...base, payable: homeConcessionDuty, saving: cents(standard - homeConcessionDuty), note: 'Home concession only — the first home rebate ends at $800,000.' }
}

/** Duty rounds to whole dollars. */
function round(n: number): number {
  return Math.round(n)
}

/** Whether this state has a duty schedule implemented. */
export function supportsDuty(state: string): state is DutyState {
  return state === 'NSW' || state === 'VIC' || state === 'QLD' || state === 'SA' || state === 'ACT' || state === 'WA' || state === 'NT'
}
