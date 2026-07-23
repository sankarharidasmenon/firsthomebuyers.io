/**
 * Build one SchemeRecord (Excel row) from a SchemeBundle, mapped to the reference
 * workbook schema (docs/Aus_Govt_Grants&Schemes_2026.xls).
 *
 * Factual values (amounts, caps, income thresholds, dates, legislation, contacts)
 * are scraped deterministically and left blank when absent. Type-derived labels
 * (Benefit Type/Unit, Value Calculation Method, Eligibility Tag) are deterministic
 * CLASSIFICATIONS based on the scheme's known type — not invented facts.
 */

import { blankRecord } from '../config/columns';
import { cleanWhitespace, dedupeSentences, normalizeUrl } from '../normalize/normalizers';
import {
  extractEmail,
  extractPhone,
  extractMaxAmount,
  extractPropertyPriceCap,
  extractIncomeCaps,
  extractFullExemptionThreshold,
  extractPartialConcessionRange,
  extractMinimumDeposit,
  extractEquityShare,
  extractLastUpdated,
  extractDateNear,
  extractSections,
  present,
  flag,
} from './fields';
import { parseStateCaps } from './stateCaps';
import type { SchemeBundle, SchemeRecord } from '../types';

const CORPUS_CAP = 80000;

export function buildRecord(bundle: SchemeBundle): SchemeRecord {
  const rec = blankRecord();
  const primary = bundle.pages[0];
  const isFederal = bundle.governmentLevel === 'Federal';

  const corpus = cleanWhitespace(
    [...bundle.pages.map((p) => p.text), ...bundle.pdfs.map((p) => p.text)].join('\n\n')
  ).slice(0, CORPUS_CAP);
  const lc = corpus.toLowerCase();
  const primaryText = cleanWhitespace(primary.text).slice(0, CORPUS_CAP);

  const officialName = bundle.seedName;
  const programType = bundle.seedProgramType; // Grant | Scheme
  const statesLabel = statesFor(bundle.jurisdiction);
  const sections = extractSections(primary.html);

  const overview = dedupeSentences(sections.overview || firstParagraph(primaryText));
  const shortDesc = firstSentence(overview);
  const longDesc = trim(overview, 1200);

  const maxGrant = extractMaxAmount(primaryText);
  const equityShare = extractEquityShare(primaryText);
  const benefit = benefitByType(bundle.detailedType, maxGrant, equityShare);

  // ── Per-state price caps (federal schemes) ──
  let caps = null as ReturnType<typeof parseStateCaps>;
  if (bundle.capsHtml || bundle.capsText) {
    caps = parseStateCaps(bundle.capsHtml, bundle.capsText);
  }

  /* ── Mandatory ── */
  rec['UI/UX Include'] = 'Yes';
  rec['UI/UX Program Type'] = programType;
  rec['UI/UX Applicable States/Territories'] = statesLabel;
  rec['UI/UX Scheme Name (official)'] = officialName;

  /* ── UI/UX block ── */
  rec['UI/UX Short Desc'] = shortDesc;
  rec['UI/UX Official Government URL'] = normalizeUrl(bundle.primaryUrl);
  rec['UI/UX Short Description'] = shortDesc;
  rec['UI/UX Long Description'] = longDesc;
  rec['UI/UX Reference Link'] = normalizeUrl(bundle.primaryUrl);

  /* ── Core identity ── */
  rec['Scheme ID'] = bundle.id;
  rec['Acronym'] = bundle.acronym;
  rec['Type'] = bundle.detailedType;
  rec['Level'] = isFederal ? 'Federal' : 'State';
  rec['Administering Body'] = bundle.agency;
  rec['Short Description'] = shortDesc;
  rec['Detailed Description'] = longDesc;
  rec['Applicable States/Territories'] = statesLabel;

  /* ── Benefit ── */
  rec['Benefit Type'] = benefit.type;
  rec['Benefit Value'] = benefit.value;
  rec['Value Unit'] = benefit.unit;
  rec['Max Value/Cap'] = maxGrant;
  rec['Value Calculation Method'] = benefit.calc;
  rec['Regional Bonus Amount'] = extractRegionalBonus(primaryText);

  /* ── Income (primary page only — avoids sibling-scheme bleed) ── */
  const income = extractIncomeCaps(primaryText);
  rec['Income Cap - Single'] = income.single;
  rec['Income Cap - Couple'] = income.couple;
  rec['Income Test Basis'] = income.single || income.couple ? 'Taxable income' : '';

  /* ── Price caps ── */
  if (caps) {
    rec['Property Price Cap'] = 'Varies by state & region';
    rec['State-by-State Value Variations'] = caps.focus; // NSW + VIC focus
    rec['Price Cap Variations'] = caps.allVariations; // all states
  } else {
    rec['Property Price Cap'] = extractPropertyPriceCap(primaryText);
  }

  /* ── Eligibility ── */
  rec['First Home Buyer Required'] = flag(lc, [/first home/, /never (?:owned|held)/, /have not (?:previously )?owned/], []);
  rec['Owner-Occupier Required'] = flag(lc, [/owner[\s-]?occup/, /live in the (?:home|property)/, /principal place of residence/, /move in(?:to)?/], []);
  rec['Citizenship/Residency'] = extractCitizenship(corpus);
  rec['Minimum Age'] = extractAge(corpus);
  rec['Eligible Property Types'] = summariseTypes(lc);
  rec['New vs Established'] = newVsEstablished(lc);
  rec['Minimum Deposit'] = extractMinimumDeposit(primaryText);
  rec['Prior Ownership Rules'] = extractPriorOwnership(corpus);
  rec['Single Parent Required'] = flag(lc, [/single parent/], []);
  rec['Dependent Children Required'] = flag(lc, [/dependent child/], []);
  rec['Relationship Status'] = relationshipStatus(lc);
  rec['Occupancy Requirement'] = extractOccupancy(corpus);

  /* ── Duty concession fields (primary page only — avoids sibling-scheme bleed) ── */
  rec['Full Exemption Threshold'] = extractFullExemptionThreshold(primaryText);
  rec['Partial Concession Range'] = extractPartialConcessionRange(primaryText);
  if (/duty|concession|exemption/i.test(bundle.detailedType)) {
    rec['Concession Calculation Method'] = 'Full or partial exemption from transfer (stamp) duty based on property value';
  }

  /* ── Quota / status / dates ── */
  rec['Places/Quota'] = extractPlaces(primaryText);
  rec['Status'] = deriveStatus(lc);
  rec['Start Date'] = extractDateNear(corpus, /(?:start(?:s|ed|ing)?|commenc(?:es|ed|ing)|available from|from)\s+(?:on\s+)?([0-9A-Za-z ,\/-]{6,30})/i);
  rec['End/Closing Date'] = extractDateNear(corpus, /(?:clos(?:es|ed|ing)|end(?:s|ed|ing)?|until|deadline|expires?)\s+(?:on\s+)?([0-9A-Za-z ,\/-]{6,30})/i);
  rec['Contract Date Window'] = extractDateWindow(corpus);
  rec['Financial Year'] = extractFinancialYear(corpus);

  /* ── Provenance / references ── */
  rec['Official Government URL'] = normalizeUrl(bundle.primaryUrl);
  rec['Legislation/Policy Reference'] = extractLegislation(corpus);
  rec['Application Method'] = extractApplicationMethod(bundle, corpus);
  rec['Last Verified Date'] = new Date().toISOString().slice(0, 10);
  rec['Source Website'] = hostOf(bundle.primaryUrl);
  rec['Eligibility Tag/Pill'] = benefit.tag;

  return rec;
}

/* ───────────────────────── type-derived classifications ───────────────────────── */

function benefitByType(
  detailedType: string,
  maxGrant: string,
  equityShare: string
): { type: string; value: string; unit: string; calc: string; tag: string } {
  const t = detailedType.toLowerCase();
  if (t === 'grant')
    return {
      type: 'Grant',
      value: maxGrant,
      unit: 'AUD (one-off grant)',
      calc: 'Fixed grant amount',
      tag: 'Cash grant',
    };
  if (t === 'guarantee')
    return {
      type: 'Guarantee',
      value: 'Government guarantee (avoids LMI)',
      unit: 'Deposit guarantee',
      calc: 'Buy with a low deposit; the government guarantees part of the loan to avoid LMI',
      tag: 'Low deposit, no LMI',
    };
  if (t === 'shared equity')
    return {
      type: 'Shared equity',
      value: equityShare || 'Government equity contribution',
      unit: 'Equity share',
      calc: 'Government co-purchases a share of the property',
      tag: 'Shared equity',
    };
  if (t === 'tax benefit')
    return {
      type: 'Tax benefit (super)',
      value: 'Withdraw voluntary super contributions',
      unit: 'Super withdrawal',
      calc: 'Withdraw eligible voluntary contributions plus associated earnings',
      tag: 'Super savings',
    };
  if (t === 'concession' || t === 'stamp duty relief')
    return {
      type: 'Duty exemption / concession',
      value: 'Duty exemption / concession',
      unit: 'Duty saving',
      calc: 'Full or partial exemption from transfer (stamp) duty based on property value',
      tag: 'Stamp duty saving',
    };
  return { type: detailedType, value: maxGrant, unit: '', calc: '', tag: '' };
}

/* ───────────────────────── helpers ───────────────────────── */

function statesFor(jurisdiction: string): string {
  const j = jurisdiction.toLowerCase();
  if (j === 'australia') return 'All States & Territories';
  if (j.includes('nsw') || j.includes('new south')) return 'NSW (New South Wales)';
  if (j.includes('vic')) return 'VIC (Victoria)';
  return jurisdiction;
}

function summariseTypes(lc: string): string {
  const t: string[] = [];
  if (present(lc, [/new home|newly built|new dwelling/])) t.push('New home');
  if (present(lc, [/established (?:home|dwelling)|existing home/])) t.push('Established home');
  if (present(lc, [/off[\s-]the[\s-]plan/])) t.push('Off-the-plan');
  if (present(lc, [/house and land|land and build/])) t.push('House and land');
  if (present(lc, [/vacant land|to build/])) t.push('Vacant land');
  if (present(lc, [/apartment|unit\b/])) t.push('Apartment/Unit');
  if (present(lc, [/townhouse/])) t.push('Townhouse');
  if (present(lc, [/substantially renovated/])) t.push('Substantially renovated');
  return t.join('; ');
}

function newVsEstablished(lc: string): string {
  const isNew = present(lc, [/new home|newly built|new dwelling/]) === 'Yes';
  const isEst = present(lc, [/established (?:home|dwelling)|existing home/]) === 'Yes';
  if (isNew && isEst) return 'Both new and established';
  if (isNew) return 'New homes only';
  if (isEst) return 'Established homes eligible';
  return '';
}

function relationshipStatus(lc: string): string {
  const parts: string[] = [];
  if (present(lc, [/single(?! parent)|individual applicant|one applicant/])) parts.push('Single');
  if (present(lc, [/couple|partner|spouse|joint applicant/])) parts.push('Couple/partner');
  return parts.join('; ');
}

function extractCitizenship(text: string): string {
  const m = text.match(/Australian citizen[^.]{0,90}(?:permanent resident|New Zealand citizen[^.]{0,40})?/i);
  if (m) return cleanWhitespace(m[0]).replace(/\s*,?\s*$/, '');
  if (/permanent resident/i.test(text)) return 'Permanent resident';
  return '';
}

function extractAge(text: string): string {
  const m = text.match(/(?:at least|aged|minimum age of|be)\s+(\d{2})\s+(?:years?(?: old| of age)?)/i);
  return m ? `${m[1]} years` : '';
}

function extractPriorOwnership(text: string): string {
  const m = text.match(/(?:must not have|have not|never)[^.]{0,20}(?:previously )?own(?:ed)?[^.]{0,80}(?:property|home|residential)[^.]{0,40}\./i);
  return m ? cleanWhitespace(m[0]) : '';
}

function extractOccupancy(text: string): string {
  const m = text.match(/(?:must )?(?:occupy|live in|move in(?:to)?)[^.]{0,80}(?:\d+\s+months?|principal place of residence|as your home)[^.]{0,40}\.?/i);
  return m ? cleanWhitespace(m[0]) : '';
}

function extractRegionalBonus(text: string): string {
  const m = text.match(/\$\s?([\d,]+)[^.]{0,30}regional|regional[^.]{0,30}\$\s?([\d,]+)/i);
  const val = m ? m[1] || m[2] : '';
  if (!val) return '';
  const n = parseFloat(val.replace(/,/g, ''));
  return !isNaN(n) && n >= 1000 && n <= 100000 ? '$' + n.toLocaleString('en-AU') : '';
}

function extractPlaces(text: string): string {
  const m = text.match(/([\d,]{3,})\s+places?(?:\s+(?:per year|each year|a year|annually|per financial year))?/i);
  if (!m) return '';
  const n = parseFloat(m[1].replace(/,/g, ''));
  return n >= 100 ? `${n.toLocaleString('en-AU')} places` : '';
}

function extractDateWindow(text: string): string {
  const m = text.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s*[–\-—]\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
  return m ? `${m[1]} – ${m[2]}` : '';
}

function extractFinancialYear(text: string): string {
  const m = text.match(/(?:financial year|FY|for)\s*(20\d{2})\s*[–\-/]\s*(\d{2,4})/i);
  if (m) return `${m[1]}–${m[2].length === 2 ? m[2] : m[2].slice(-2)}`;
  return '';
}

function deriveStatus(lc: string): string {
  if (/this (?:scheme|grant|program|fund) (?:has|is now) closed|no longer accepting (?:new )?applications|applications (?:have|are) closed/.test(lc))
    return 'Closed';
  return 'Active';
}

function extractLegislation(text: string): string {
  const acts = new Set<string>();
  const re = /\b([A-Z][A-Za-z'(),]*(?:\s+[A-Z(][A-Za-z'(),.]*){0,7}\s+(?:Act|Regulations?)\s+\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    if (name.length < 90) acts.add(name);
    if (acts.size >= 5) break;
  }
  return [...acts].join('; ');
}

function extractApplicationMethod(bundle: SchemeBundle, text: string): string {
  if (/through (?:an|a) (?:approved|participating) lender|via your lender|participating lender/i.test(text))
    return 'Through an approved/participating lender';
  if (/conveyancer|solicitor|at settlement/i.test(text)) return 'Via conveyancer/solicitor at settlement';
  if (/approved agent/i.test(text)) return 'Through an approved agent';
  const hasApply = bundle.pages.slice(1).some((p) => /apply|application/i.test(p.finalUrl) || /apply|application/i.test(p.title));
  return hasApply ? 'Application required (see official page)' : '';
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  const s = (m ? m[0] : text).trim();
  return s.length > 220 ? s.slice(0, 217).trimEnd() + '…' : s;
}

function firstParagraph(text: string): string {
  const parts = text.split(/\n{2,}/).map((p) => p.trim());
  return parts.find((p) => p.length > 80) || text.slice(0, 400);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function trim(s: string, max: number): string {
  const c = cleanWhitespace(s);
  return c.length > max ? c.slice(0, max - 1).trimEnd() + '…' : c;
}
