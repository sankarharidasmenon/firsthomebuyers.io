/**
 * Benefit extraction — determines the benefit type, headline value, unit and
 * any concession thresholds. Heuristic and conservative.
 */
import type { SchemeType } from '../types';
import {
  extractMoney,
  extractPercentages,
  formatMoney,
  includesAny,
  joinCell,
  sentencesWith,
  truncate,
} from '../utils/helpers';

export interface BenefitFields {
  benefitType: string;
  benefitValue: string;
  valueUnit: string;
  maxValueCap: string;
  regionalBonusAmount: string;
  valueCalculationMethod: string;
  fullExemptionThreshold: string;
  partialConcessionRange: string;
  concessionCalculationMethod: string;
}

/**
 * Corroborating keywords for each scheme type. Used both to detect a type from
 * scratch and to confirm a curated `typeHint` before it overrides text signals.
 */
const TYPE_SIGNALS: Record<Exclude<SchemeType, 'Unknown'>, string[]> = {
  Grant: ['grant of', 'one-off payment', 'first home owner grant', 'first home grant', '$10,000', '$30,000', 'cash payment'],
  Guarantee: ['guarantee', 'lenders mortgage insurance', 'lmi', '5% deposit', '2% deposit'],
  'Shared Equity': ['shared equity', 'equity contribution', 'co-purchase', 'co-buy', 'help to buy'],
  'Stamp Duty Relief': ['stamp duty', 'transfer duty', 'duty exemption', 'rate of duty', 'land transfer duty'],
  'Tax Benefit': ['super saver', 'superannuation', 'voluntary contributions', 'first home super saver'],
  Concession: ['concession', 'reduction', 'reduced duty'],
};

/**
 * Classify the benefit type from page text + configured hint.
 *
 * The curated `typeHint` from sources.ts reflects a human-verified program type.
 * We honour it whenever the page text corroborates it (avoids hub pages that
 * mention "stamp duty" links mis-classifying a grant). Only if the hint is NOT
 * corroborated do we fall back to pure keyword detection.
 */
export function classifyBenefitType(text: string, hint?: SchemeType): SchemeType {
  const lower = text.toLowerCase();

  if (hint && hint !== 'Unknown') {
    const signals = TYPE_SIGNALS[hint as Exclude<SchemeType, 'Unknown'>];
    if (signals && includesAny(lower, signals)) return hint;
  }

  if (includesAny(lower, TYPE_SIGNALS.Guarantee)) return 'Guarantee';
  if (includesAny(lower, TYPE_SIGNALS['Shared Equity'])) return 'Shared Equity';
  if (includesAny(lower, TYPE_SIGNALS['Tax Benefit'])) return 'Tax Benefit';
  if (includesAny(lower, TYPE_SIGNALS.Grant)) return 'Grant';
  if (includesAny(lower, TYPE_SIGNALS['Stamp Duty Relief'])) return 'Stamp Duty Relief';
  if (includesAny(lower, TYPE_SIGNALS.Concession)) return 'Concession';
  return hint || 'Unknown';
}

export function extractBenefit(text: string, hint?: SchemeType): BenefitFields {
  const type = classifyBenefitType(text, hint);

  let benefitValue = '';
  let valueUnit = '';
  let maxValueCap = '';
  let regionalBonusAmount = '';
  let valueCalculationMethod = '';

  if (type === 'Grant') {
    // Grants are fixed cash amounts, realistically $1,000–$60,000. We only count
    // figures that sit in a GRANT-POSITIVE sentence and NOT in a penalty/fee
    // context — critical because pages state penalties like "fined up to $11,000"
    // that must never be mistaken for the grant. Among qualifying figures we take
    // the mode (headline grant is repeated); if none qualify we leave it blank
    // rather than guess.
    const GRANT_MIN = 1_000;
    const GRANT_MAX = 60_000;
    const POSITIVE = ['grant', 'receive', 'payment', 'paid', 'worth', 'boost', 'assistance of'];
    const NEGATIVE = ['fine', 'fined', 'penalty', 'penalties', 'repay', 'repayment', 'fee', 'interest', 'prosecut', 'offence'];

    const freq = new Map<number, number>();
    for (const s of sentencesWith(text, POSITIVE)) {
      if (includesAny(s, NEGATIVE)) continue; // skip penalty/repayment sentences
      for (const m of extractMoney(s)) {
        if (m.value >= GRANT_MIN && m.value <= GRANT_MAX) {
          freq.set(m.value, (freq.get(m.value) || 0) + 1);
        }
      }
    }
    if (freq.size) {
      // Highest count wins; ties broken by the larger amount (headline grant).
      const best = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
      benefitValue = formatMoney(best[0]);
      valueUnit = 'AUD (one-off grant)';
    }
    valueCalculationMethod = 'Fixed grant amount';
  } else if (type === 'Guarantee') {
    benefitValue = 'Government guarantee (avoids LMI)';
    valueUnit = 'Deposit guarantee';
    const depMatch = text.match(/(\d{1,2})\s?%\s+deposit/i);
    valueCalculationMethod = depMatch
      ? `Buy with ${depMatch[1]}% deposit, government guarantees the balance to avoid LMI`
      : 'Government guarantees part of the loan so no LMI is payable';
  } else if (type === 'Shared Equity') {
    const pct = extractPercentages(text);
    benefitValue = pct.length ? `Up to ${pct[0]} equity contribution` : 'Government equity contribution';
    valueUnit = 'Equity share';
    valueCalculationMethod = 'Government co-purchases a share of the property';
  } else if (type === 'Tax Benefit') {
    const money = extractMoney(text).filter((m) => m.value >= 10_000);
    benefitValue = money.length
      ? `Withdraw up to ${formatMoney(Math.max(...money.map((m) => m.value)))} of voluntary super contributions`
      : 'Withdraw voluntary super contributions for a deposit';
    valueUnit = 'Super withdrawal';
    valueCalculationMethod = 'Withdraw eligible voluntary contributions plus associated earnings';
  } else if (type === 'Stamp Duty Relief' || type === 'Concession') {
    benefitValue = 'Duty exemption / concession';
    valueUnit = 'Duty saving';
    valueCalculationMethod =
      'Full or partial exemption from transfer (stamp) duty based on property value';
  }

  // Max value / cap — only meaningful for cash grants (a dollar ceiling on the
  // benefit). For guarantees/shared-equity/tax types a "$X" on the page is
  // usually a cross-referenced figure, so we don't populate a misleading cap.
  if (type === 'Grant') {
    for (const s of sentencesWith(text, ['up to', 'maximum', 'capped at', 'no more than'])) {
      const money = extractMoney(s).filter((mm) => mm.value >= 1000 && mm.value <= 60_000);
      if (money.length) {
        maxValueCap = formatMoney(money.reduce((a, b) => (b.value > a.value ? b : a)).value);
        break;
      }
    }
  }

  // Regional bonus.
  const regionalSentences = sentencesWith(text, ['regional', 'regional bonus', 'regional loading']);
  for (const s of regionalSentences) {
    const money = extractMoney(s);
    if (money.length && includesAny(s.toLowerCase(), ['bonus', 'additional', 'extra', 'loading'])) {
      regionalBonusAmount = formatMoney(money.reduce((a, b) => (b.value > a.value ? b : a)).value);
      break;
    }
  }

  // ── Concession thresholds ──────────────────────────────────────────────────
  let fullExemptionThreshold = '';
  let partialConcessionRange = '';
  let concessionCalculationMethod = '';

  if (type === 'Stamp Duty Relief' || type === 'Concession') {
    // Only property-scale figures (≥ $100k), never penalties/fees.
    const PENALTY = ['penalt', 'fine', 'fined', 'fee', 'repay', 'interest'];
    const propMoney = (s: string) => extractMoney(s).filter((m) => m.value >= 100_000);

    const fullSentences = sentencesWith(text, [
      'full exemption', 'exempt from duty', 'no duty', 'pay no duty', 'do not pay duty',
    ]).filter((s) => !includesAny(s, PENALTY) && propMoney(s).length);
    if (fullSentences.length) {
      fullExemptionThreshold = formatMoney(Math.max(...propMoney(fullSentences[0]).map((m) => m.value)));
    }

    const partialSentences = sentencesWith(text, [
      'partial', 'concession applies', 'sliding scale', 'between', 'reduced duty',
    ]).filter((s) => !includesAny(s, PENALTY) && propMoney(s).length >= 2);
    if (partialSentences.length) {
      const money = propMoney(partialSentences[0]).map((m) => m.value).sort((a, b) => a - b);
      if (money.length >= 2) {
        partialConcessionRange = `${formatMoney(money[0])} – ${formatMoney(money[money.length - 1])}`;
      }
    }
    // Canonical short method (never a copied paragraph).
    if (partialConcessionRange) {
      concessionCalculationMethod = `Sliding-scale concession between ${partialConcessionRange}`;
    } else if (fullExemptionThreshold) {
      concessionCalculationMethod = `Full exemption up to ${fullExemptionThreshold}`;
    }
  }

  return {
    benefitType: type,
    benefitValue,
    valueUnit,
    maxValueCap,
    regionalBonusAmount,
    valueCalculationMethod,
    fullExemptionThreshold,
    partialConcessionRange,
    concessionCalculationMethod,
  };
}
