/**
 * Deterministic description composer (NO AI / NO LLM).
 *
 * Produces clean, frontend-ready Short and Detailed descriptions by composing
 * sentences from the scheme's ALREADY-EXTRACTED structured facts (benefit type,
 * value, property type, jurisdiction, eligibility flags). Because it only
 * restates values that were extracted from the official page/PDF, it never
 * invents information and never contains navigation, headings, breadcrumbs,
 * marketing slogans, unrelated schemes or repeated text.
 *
 * Limits: Short ≤ 150 chars (one sentence), Detailed ≤ 500 chars.
 */
import { cleanText, truncate } from '../utils/helpers';

export interface DescriptionInput {
  schemeName: string;
  benefitType: string;
  benefitValue: string;
  minimumDeposit: string;
  newVsEstablished: string;
  jurisdiction: string;
  administeringBody: string;
  propertyPriceCap: string;
  citizenshipResidency: string;
  occupancyRequirement: string;
  priorOwnershipRules: string;
  incomeCapSingle: string;
  incomeCapCouple: string;
  /** Cleaned page meta description — used only as a last-resort fallback. */
  metaDescription: string;
}

const SHORT_MAX = 150;
const DETAIL_MAX = 500;

export function composeDescriptions(input: DescriptionInput): {
  shortDescription: string;
  detailedDescription: string;
} {
  const shortDescription = capOneSentence(buildShort(input), SHORT_MAX);
  const detailedDescription = capSentences(buildDetailed(input), DETAIL_MAX);
  return { shortDescription, detailedDescription };
}

// ── Location / property phrasing ────────────────────────────────────────────

function locationClause(jurisdiction: string): string {
  return jurisdiction === 'FED' ? 'across Australia' : `in ${jurisdiction}`;
}

function shortProperty(nve: string): string {
  if (/new homes only/i.test(nve)) return 'a new home';
  if (/established homes eligible/i.test(nve)) return 'an established home';
  return 'a home';
}

function detailProperty(nve: string): string {
  if (/new homes only/i.test(nve)) return 'a new residential property';
  if (/established homes eligible/i.test(nve)) return 'an established residential property';
  return 'a residential property';
}

function buyOrBuild(nve: string): string {
  return /new homes only|both new/i.test(nve) ? 'purchasing or building' : 'purchasing';
}

/** "$10,000" → true if it's a dollar figure (vs "Duty exemption / concession"). */
function isDollar(v: string): boolean {
  return /^\$[\d,]/.test(v.trim());
}

// ── Eligibility requirement clause (only mentions fields that were found) ────

function requirementList(i: DescriptionInput): string[] {
  const reqs: string[] = [];
  if (i.priorOwnershipRules) reqs.push('ownership');
  if (i.citizenshipResidency) reqs.push('residency');
  if (i.occupancyRequirement) reqs.push('occupancy');
  if (i.incomeCapSingle || i.incomeCapCouple) reqs.push('income');
  if (i.propertyPriceCap) reqs.push('property value');
  return reqs;
}

function eligibilitySentence(i: DescriptionInput): string {
  const reqs = requirementList(i);
  const body = i.administeringBody || 'the administering authority';
  if (!reqs.length) return `Eligibility requirements are defined by ${body}.`;
  return `Applicants must satisfy ${andList(reqs)} requirements defined by ${body}.`;
}

function andList(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ── SHORT description ───────────────────────────────────────────────────────

function buildShort(i: DescriptionInput): string {
  const loc = locationClause(i.jurisdiction);
  const type = i.benefitType;

  if (type === 'Grant') {
    const amount = isDollar(i.benefitValue) ? `a ${i.benefitValue} grant` : 'a grant';
    return `Eligible first home buyers can receive ${amount} when ${buyOrBuild(i.newVsEstablished)} ${shortProperty(i.newVsEstablished)} ${loc}.`;
  }
  if (type === 'Guarantee') {
    return i.minimumDeposit
      ? `Eligible first home buyers can purchase a home with as little as a ${i.minimumDeposit} deposit without paying Lenders Mortgage Insurance.`
      : `A government guarantee helping eligible first home buyers purchase with a low deposit and avoid Lenders Mortgage Insurance.`;
  }
  if (type === 'Shared Equity') {
    return `The government contributes toward the purchase price so eligible first home buyers can buy their first home with a smaller deposit.`;
  }
  if (type === 'Tax Benefit') {
    return `Eligible first home buyers can withdraw voluntary super contributions to help fund their first home deposit.`;
  }
  if (type === 'Stamp Duty Relief' || type === 'Concession') {
    return `Eligible first home buyers may pay reduced or no stamp duty when buying ${shortProperty(i.newVsEstablished)} ${loc}.`;
  }
  // Fallback: a cleaned single sentence from the page meta description.
  const meta = firstSentence(cleanText(i.metaDescription));
  return meta || `Government support to help eligible first home buyers purchase their first home ${loc}.`;
}

// ── DETAILED description ────────────────────────────────────────────────────

function buildDetailed(i: DescriptionInput): string {
  const loc = locationClause(i.jurisdiction);
  const type = i.benefitType;
  const name = i.schemeName || 'This scheme';
  const sentences: string[] = [];

  if (type === 'Grant') {
    const amount = isDollar(i.benefitValue) ? `a one-off ${i.benefitValue} payment` : 'a one-off payment';
    sentences.push(
      `The ${name} provides ${amount} to eligible first home buyers ${buyOrBuild(i.newVsEstablished)} ${detailProperty(i.newVsEstablished)} ${loc}.`
    );
  } else if (type === 'Guarantee') {
    const dep = i.minimumDeposit ? `a minimum ${i.minimumDeposit} deposit` : 'a low deposit';
    sentences.push(
      `The ${name} allows eligible first home buyers to purchase a home with ${dep}. The Australian Government guarantees part of the loan, helping eligible borrowers avoid paying Lenders Mortgage Insurance.`
    );
  } else if (type === 'Shared Equity') {
    sentences.push(
      `Under the ${name}, the Australian Government contributes toward the purchase price of a home, reducing the deposit and loan an eligible first home buyer needs.`
    );
  } else if (type === 'Tax Benefit') {
    sentences.push(
      `The ${name} lets eligible first home buyers withdraw eligible voluntary superannuation contributions to put toward their first home deposit.`
    );
  } else if (type === 'Stamp Duty Relief' || type === 'Concession') {
    const cap = i.propertyPriceCap ? ` for homes valued up to ${i.propertyPriceCap}` : '';
    sentences.push(
      `The ${name} provides a full or partial exemption from stamp (transfer) duty for eligible first home buyers ${loc}${cap}.`
    );
  } else {
    const meta = firstSentence(cleanText(i.metaDescription));
    if (meta) sentences.push(meta);
    else sentences.push(`The ${name} provides government support for eligible first home buyers ${loc}.`);
  }

  // Eligibility/conditions sentence (guarantee already covers its own detail).
  if (type !== 'Guarantee') sentences.push(eligibilitySentence(i));

  return sentences.join(' ');
}

// ── Text utilities (caps that preserve whole sentences) ─────────────────────

function firstSentence(text: string): string {
  const m = text.split(/(?<=[.!?])\s+/).find((s) => s.trim().length > 20);
  return m ? m.trim() : '';
}

/** Ensure a single sentence within max chars (word-boundary fallback). */
function capOneSentence(text: string, max: number): string {
  const t = cleanText(text);
  if (t.length <= max) return t;
  return truncate(t, max);
}

/** Keep as many whole sentences as fit within max; never cut mid-sentence. */
function capSentences(text: string, max: number): string {
  const clean = cleanText(text);
  if (clean.length <= max) return clean;
  const parts = clean.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const s of parts) {
    if ((out ? out.length + 1 : 0) + s.length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  return out || truncate(clean, max);
}
