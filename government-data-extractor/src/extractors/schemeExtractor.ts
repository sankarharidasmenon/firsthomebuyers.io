/**
 * Scheme extractor — top-level assembly of a single SchemeRecord (= one Excel
 * row) from a source's HTML text, headings/list items, and any PDF text.
 *
 * It combines the eligibility and benefit sub-extractors and fills the
 * remaining descriptive / timeline / legislation / metadata columns.
 *
 * ONE row = ONE scheme. If a page clearly contains multiple distinct schemes,
 * `splitSchemes()` can be used by the caller, but our source list already maps
 * one URL → one program, so we extract a single record per source by default.
 */
import type { Source, SchemeRecord } from '../types';
import type { ParsedHtml } from '../parsers/htmlParser';
import { extractEligibility } from './eligibilityExtractor';
import { extractBenefit } from './benefitExtractor';
import { composeDescriptions } from './descriptionComposer';
import {
  extractDates,
  extractFinancialYear,
  includesAny,
  joinCell,
  normalizeWhitespace,
  sentencesWith,
  splitSentences,
  truncate,
  uniq,
} from '../utils/helpers';

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
  NT: 'Northern Territory',
  FED: 'All States & Territories',
};

export interface ExtractionInput {
  source: Source;
  parsed: ParsedHtml;
  pdfText: string;
  officialUrl: string;
  changed: boolean;
}

export function extractScheme(input: ExtractionInput): SchemeRecord {
  const { source, parsed, pdfText, officialUrl } = input;

  // HTML-only text (the authoritative page). Used for fields where PDF content
  // would introduce noise — notably scheme status.
  const htmlText = normalizeWhitespace([parsed.text, parsed.listItems.join('. ')].join('\n'));

  // Combined corpus: HTML text + list items + PDF text. Extractors mine this.
  const corpus = normalizeWhitespace(
    [parsed.text, parsed.listItems.join('. '), pdfText].filter(Boolean).join('\n')
  );

  // Eligibility can legitimately draw on PDFs (fact sheets); the headline
  // benefit/value is always on the main HTML page, so extract it from HTML only
  // to avoid PDF cross-references skewing figures (spec: prefer HTML over PDF).
  const eligibility = extractEligibility(corpus);
  const benefit = extractBenefit(htmlText, source.typeHint);

  // ── Name & acronym ──────────────────────────────────────────────────────
  const schemeName = pickSchemeName(source, parsed);
  const acronym = deriveAcronym(schemeName);

  // ── Descriptions — deterministically composed from extracted facts ───────
  // (clean, frontend-ready; no page text/nav/headings; never invents anything).
  const { shortDescription, detailedDescription } = composeDescriptions({
    schemeName,
    benefitType: benefit.benefitType,
    benefitValue: benefit.benefitValue,
    minimumDeposit: eligibility.minimumDeposit,
    newVsEstablished: eligibility.newVsEstablished,
    jurisdiction: source.jurisdiction,
    administeringBody: source.administeringBody,
    propertyPriceCap: eligibility.propertyPriceCap,
    citizenshipResidency: eligibility.citizenshipResidency,
    occupancyRequirement: eligibility.occupancyRequirement,
    priorOwnershipRules: eligibility.priorOwnershipRules,
    incomeCapSingle: eligibility.incomeCapSingle,
    incomeCapCouple: eligibility.incomeCapCouple,
    metaDescription: parsed.metaDescription,
  });

  // ── Geography ───────────────────────────────────────────────────────────
  const applicableStates =
    source.jurisdiction === 'FED'
      ? 'All States & Territories'
      : `${source.jurisdiction} (${STATE_NAMES[source.jurisdiction] ?? source.jurisdiction})`;

  const metroVsRegional = deriveMetroRegional(corpus);
  const postcodeRegionRestrictions = derivePostcodeRestrictions(corpus);

  // ── Timeline ────────────────────────────────────────────────────────────
  const { startDate, endClosingDate, contractDateWindow } = extractTimeline(corpus);
  const financialYear = extractFinancialYear(corpus);

  // ── Combination rules (short clean clauses only) ─────────────────────────
  const canBeCombinedWith = joinCell(
    splitSentences(corpus)
      .filter((s) => includesAny(s, ['can be combined', 'in addition to', 'alongside', 'together with']))
      .filter((s) => includesAny(s, ['grant', 'scheme', 'concession', 'guarantee', 'duty']))
      .filter((s) => s.length <= 140)
      .slice(0, 1)
  );
  const mutuallyExclusiveWith = joinCell(
    splitSentences(corpus)
      .filter((s) => includesAny(s, ['cannot be combined', 'cannot be used with', 'not available if', 'mutually exclusive']))
      .filter((s) => s.length <= 140)
      .slice(0, 1)
  );

  // ── Places / quota ──────────────────────────────────────────────────────
  let placesQuota = '';
  const quotaMatch = corpus.match(/([\d,]{3,})\s+(?:places|guarantees|spots)/i);
  if (quotaMatch) placesQuota = `${quotaMatch[1]} places`;

  // ── Legislation ─────────────────────────────────────────────────────────
  const legislationReference = joinCell(extractLegislation(corpus).slice(0, 3));

  // ── Application method ──────────────────────────────────────────────────
  const applicationMethod = deriveApplicationMethod(corpus);

  // ── Status ──────────────────────────────────────────────────────────────
  // From the HTML page only — PDFs often reference retired predecessor schemes.
  const status = deriveStatus(htmlText);

  // ── Notes / caveats (one short clean caveat, no boilerplate) ─────────────
  const notesCaveats = joinCell(
    splitSentences(corpus)
      .filter((s) => includesAny(s, ['please note', 'important:', 'conditions apply', 'subject to change', 'you may need to repay']))
      .filter((s) => s.length >= 20 && s.length <= 160)
      .filter((s) => !includesAny(s, ['last updated', 'cookie', 'javascript', 'this fact sheet provides guidance']))
      .slice(0, 1)
  );

  // ── Presentation fields (tag, ranking, hook) ────────────────────────────
  const eligibilityTag = deriveEligibilityTag(benefit.benefitType);
  const priorityRanking = derivePriority(source);
  const catchyLine = deriveCatchyLine(schemeName, benefit.benefitType, benefit.benefitValue);

  const record: SchemeRecord = {
    schemeId: source.id,
    schemeName,
    acronym,
    type: benefit.benefitType,
    level: source.level,
    administeringBody: source.administeringBody,
    shortDescription,
    detailedDescription,
    applicableStates,
    metroVsRegional,
    postcodeRegionRestrictions,
    benefitType: benefit.benefitType,
    benefitValue: benefit.benefitValue,
    valueUnit: benefit.valueUnit,
    maxValueCap: benefit.maxValueCap,
    stateByStateValueVariations: source.jurisdiction === 'FED' ? '' : '',
    regionalBonusAmount: benefit.regionalBonusAmount,
    valueCalculationMethod: benefit.valueCalculationMethod,
    firstHomeBuyerRequired: eligibility.firstHomeBuyerRequired,
    ownerOccupierRequired: eligibility.ownerOccupierRequired,
    citizenshipResidency: eligibility.citizenshipResidency,
    minimumAge: eligibility.minimumAge,
    incomeCapSingle: eligibility.incomeCapSingle,
    incomeCapCouple: eligibility.incomeCapCouple,
    incomeTestBasis: eligibility.incomeTestBasis,
    propertyPriceCap: eligibility.propertyPriceCap,
    priceCapVariations: eligibility.priceCapVariations,
    eligiblePropertyTypes: eligibility.eligiblePropertyTypes,
    newVsEstablished: eligibility.newVsEstablished,
    minimumDeposit: eligibility.minimumDeposit,
    priorOwnershipRules: eligibility.priorOwnershipRules,
    singleParentRequired: eligibility.singleParentRequired,
    dependentChildrenRequired: eligibility.dependentChildrenRequired,
    relationshipStatus: eligibility.relationshipStatus,
    occupancyRequirement: eligibility.occupancyRequirement,
    otherConditions: eligibility.otherConditions,
    fullExemptionThreshold: benefit.fullExemptionThreshold,
    partialConcessionRange: benefit.partialConcessionRange,
    concessionCalculationMethod: benefit.concessionCalculationMethod,
    canBeCombinedWith,
    mutuallyExclusiveWith,
    placesQuota,
    status,
    startDate,
    endClosingDate,
    contractDateWindow,
    financialYear,
    officialUrl,
    legislationReference,
    applicationMethod,
    lastVerifiedDate: new Date().toISOString().slice(0, 10),
    sourceWebsite: safeHost(officialUrl),
    notesCaveats,
    eligibilityTag,
    priorityRanking,
    catchyLine,
  };

  return record;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Marketing hero headings we must never mistake for a program name.
const GENERIC_HEADINGS = [
  'your path to home',
  'starts here',
  'welcome',
  'home guarantee scheme',
  'first home buyers',
  'support to buy',
  'guide to the grant', // "HomeGrown Territory – guide to the grants"
  'guide to grants',
];

function pickSchemeName(source: Source, parsed: ParsedHtml): string {
  // Prefer the page's H1 ONLY if it names a specific program (strong scheme
  // keyword) and isn't a generic hero/marketing heading. Otherwise fall back to
  // the curated program name from sources.ts.
  const h1 = normalizeWhitespace(parsed.headings[0] || '');
  const looksSpecific =
    h1.length > 0 &&
    h1.length < 90 &&
    includesAny(h1, ['grant', 'guarantee', 'super saver', 'concession', 'rate of duty', 'duty exemption', 'help to buy', 'assistance scheme']) &&
    !GENERIC_HEADINGS.some((g) => h1.toLowerCase().includes(g));
  return looksSpecific ? h1 : source.programName;
}

function deriveAcronym(name: string): string {
  const key = name.toLowerCase();
  // Order matters: check more specific names before generic ones.
  const known: Array<[string, string]> = [
    ['regional first home buyer guarantee', 'RFHBG'],
    ['first home super saver', 'FHSSS'],
    ['first home buyers assistance', 'FHBAS'],
    ['first home guarantee', 'FHBG'],
    ['family home guarantee', 'FHG'],
    ['home buyer concession', 'HBCS'],
    ['first home owner rate of duty', 'FHOR'], // must precede generic "first home owner"
    ['first home owner rate', 'FHOR'],
    ['first home owner grant', 'FHOG'],
    ['first home owner', 'FHOG'], // "First Home Owner (New Homes) Grant" etc.
    ['help to buy', 'HTB'],
  ];
  for (const [k, v] of known) if (key.includes(k)) return v;
  // Fallback: initials of significant words (letters only; skip stopwords).
  const stop = new Set(['of', 'the', 'and', 'for', 'to', 'a', 'in', 'or', 'new', 'homes', 'home']);
  const initials = name
    .replace(/[^a-zA-Z\s]/g, ' ') // drop parentheses/punctuation
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()))
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return initials.length >= 2 && initials.length <= 6 ? initials : '';
}

function firstMeaningfulSentence(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.find((s) => s.length > 40) || sentences[0] || '';
}

function deriveMetroRegional(text: string): string {
  const hasRegional = includesAny(text, ['regional']);
  const hasMetro = includesAny(text, ['metropolitan', 'capital city', 'metro']);
  if (hasRegional && hasMetro) return 'Metro and regional (different caps may apply)';
  if (hasRegional) return 'Regional provisions apply';
  return '';
}

function derivePostcodeRestrictions(text: string): string {
  const s = splitSentences(text).filter((x) =>
    includesAny(x, ['postcode', 'eligible region', 'designated region'])
  );
  const short = s.find((x) => x.length <= 160);
  return short ? truncate(short, 160) : '';
}

function extractTimeline(text: string): {
  startDate: string;
  endClosingDate: string;
  contractDateWindow: string;
} {
  let startDate = '';
  let endClosingDate = '';
  let contractDateWindow = '';

  const startS = sentencesWith(text, ['commences', 'available from', 'from 1 ', 'effective from', 'start date', 'on or after']);
  for (const s of startS) {
    const d = extractDates(s);
    if (d.length) {
      startDate = d[0];
      break;
    }
  }

  const endS = sentencesWith(text, ['closes', 'closing date', 'until', 'ends on', 'expires', 'available until', 'before']);
  for (const s of endS) {
    const d = extractDates(s);
    if (d.length) {
      endClosingDate = d[d.length - 1];
      break;
    }
  }

  // Contract date window → just the date(s), never the whole sentence.
  const contractS = sentencesWith(text, ['contract', 'entered into', 'signed', 'transaction date']);
  for (const s of contractS) {
    const d = extractDates(s);
    if (d.length) {
      const dates = uniq(d).slice(0, 2);
      const onOrAfter = /on or after/i.test(s);
      contractDateWindow =
        dates.length === 1
          ? (onOrAfter ? `On or after ${dates[0]}` : dates[0])
          : `${dates[0]} – ${dates[1]}`;
      break;
    }
  }

  return { startDate, endClosingDate, contractDateWindow };
}

function extractLegislation(text: string): string[] {
  const out: string[] = [];
  const re = /\b([A-Z][A-Za-z’']+(?:\s+[A-Z][A-Za-z’']+)*\s+Act\s+\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[1]);
  const reReg = /\b([A-Z][A-Za-z’']+(?:\s+[A-Z][A-Za-z’']+)*\s+(?:Regulations?|Regulation)\s+\d{4})\b/g;
  while ((m = reReg.exec(text)) !== null) out.push(m[1]);
  return uniq(out);
}

function deriveApplicationMethod(text: string): string {
  if (includesAny(text, ['apply online', 'online application', 'online form'])) return 'Online application';
  if (includesAny(text, ['through your lender', 'approved lender', 'participating lender', 'via your bank']))
    return 'Through an approved/participating lender';
  if (includesAny(text, ['through your conveyancer', 'solicitor', 'at settlement']))
    return 'Via conveyancer/solicitor at settlement';
  if (includesAny(text, ['apply', 'application form'])) return 'Application required (see official page)';
  return '';
}

function deriveStatus(text: string): string {
  // Require unambiguous closure phrasing — a stray "closed" (e.g. "applications
  // for the previous scheme closed") must NOT flip a live scheme to Closed.
  if (includesAny(text, ['this scheme is closed', 'scheme has closed', 'no longer available', 'is now closed', 'has been discontinued', 'scheme has ended']))
    return 'Closed';
  // Only flag Open/Upcoming on unambiguous future-launch phrasing. Words like
  // "commencing" or a future end-date appear on plenty of active schemes.
  if (includesAny(text, ['scheme opens on', 'will open on', 'opening soon', 'not yet open', 'applications open from']))
    return 'Open/Upcoming';
  return 'Active';
}

function deriveEligibilityTag(type: string): string {
  switch (type) {
    case 'Grant':
      return 'Cash grant';
    case 'Guarantee':
      return 'Low deposit, no LMI';
    case 'Shared Equity':
      return 'Shared equity';
    case 'Tax Benefit':
      return 'Super savings';
    case 'Stamp Duty Relief':
    case 'Concession':
      return 'Stamp duty saving';
    default:
      return 'First home buyer support';
  }
}

function derivePriority(source: Source): string {
  // Simple heuristic: grants and guarantees rank highest for FHBs.
  const highValue = ['fhog', 'grant', 'guarantee'].some((k) => source.id.includes(k));
  if (source.level === 'Federal') return highValue ? '1' : '2';
  return highValue ? '2' : '3';
}

function deriveCatchyLine(name: string, type: string, value: string): string {
  switch (type) {
    case 'Grant':
      return value ? `Get ${value} towards your first home.` : 'A cash boost for your first home.';
    case 'Guarantee':
      return 'Buy with a low deposit — no Lenders Mortgage Insurance.';
    case 'Shared Equity':
      return 'Let the government co-buy your first home.';
    case 'Tax Benefit':
      return 'Supercharge your deposit through your super.';
    case 'Stamp Duty Relief':
    case 'Concession':
      return 'Pay less (or no) stamp duty on your first home.';
    default:
      return `Support for first home buyers: ${name}.`;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
