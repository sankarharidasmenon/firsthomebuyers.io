/**
 * Eligibility extraction — heuristic, rule-based (no AI in Phase 1).
 *
 * Each function scans normalized page/PDF text for well-known phrasings and
 * returns a value ONLY when confident. Ambiguity → empty string (never invent).
 */
import {
  extractMoney,
  formatMoney,
  includesAny,
  joinCell,
  sentencesWith,
  splitSentences,
  uniq,
} from '../utils/helpers';

export interface EligibilityFields {
  firstHomeBuyerRequired: string;
  ownerOccupierRequired: string;
  citizenshipResidency: string;
  minimumAge: string;
  incomeCapSingle: string;
  incomeCapCouple: string;
  incomeTestBasis: string;
  propertyPriceCap: string;
  priceCapVariations: string;
  eligiblePropertyTypes: string;
  newVsEstablished: string;
  minimumDeposit: string;
  priorOwnershipRules: string;
  singleParentRequired: string;
  dependentChildrenRequired: string;
  relationshipStatus: string;
  occupancyRequirement: string;
  otherConditions: string;
}

/** Yes/No/blank helper — returns 'Yes' if positive phrasing found. */
function yesIf(text: string, keywords: string[]): string {
  return includesAny(text, keywords) ? 'Yes' : '';
}

export function extractEligibility(text: string): EligibilityFields {
  const lower = text.toLowerCase();

  // ── First home buyer requirement ──────────────────────────────────────────
  const firstHomeBuyerRequired = includesAny(text, [
    'first home buyer',
    'first home owner',
    'first-home buyer',
    'never owned',
    'not previously owned',
    'have not owned',
  ])
    ? 'Yes'
    : '';

  // ── Owner-occupier requirement ────────────────────────────────────────────
  const ownerOccupierRequired = includesAny(text, [
    'owner-occupier',
    'owner occupier',
    'live in the',
    'occupy the',
    'as your principal place of residence',
    'move into',
  ])
    ? 'Yes'
    : '';

  // ── Citizenship / residency (canonical short value, not a paragraph) ──────
  const citParts: string[] = [];
  if (includesAny(text, ['australian citizen'])) citParts.push('Australian citizen');
  if (includesAny(text, ['permanent resident', 'permanent residency'])) citParts.push('permanent resident');
  if (includesAny(text, ['new zealand citizen'])) citParts.push('New Zealand citizen (Special Category visa)');
  let citizenshipResidency = citParts.join(' or ');
  if (citizenshipResidency) {
    citizenshipResidency = citizenshipResidency.charAt(0).toUpperCase() + citizenshipResidency.slice(1);
  }

  // ── Minimum age ───────────────────────────────────────────────────────────
  let minimumAge = '';
  const ageMatch = text.match(/at least\s+(\d{2})\s+years?(?:\s+of\s+age|\s+old)/i) ||
    text.match(/(\d{2})\s+years?\s+of\s+age\s+or\s+(?:older|over)/i) ||
    text.match(/aged\s+(\d{2})\s+(?:or\s+over|and\s+over)/i);
  if (ageMatch) minimumAge = `${ageMatch[1]} years`;
  else if (/\b18\s+years?\b/.test(lower) && includesAny(lower, ['at least', 'or older', 'or over']))
    minimumAge = '18 years';

  // ── Income caps ───────────────────────────────────────────────────────────
  const { incomeCapSingle, incomeCapCouple, incomeTestBasis } = extractIncomeCaps(text);

  // ── Property price cap ────────────────────────────────────────────────────
  const { propertyPriceCap, priceCapVariations } = extractPriceCap(text);

  // ── Eligible property types ───────────────────────────────────────────────
  const typeMap: Array<[string, string[]]> = [
    ['New home', ['new home', 'newly built', 'newly constructed', 'brand new']],
    ['Established home', ['established home', 'existing home', 'existing dwelling']],
    ['Off-the-plan', ['off-the-plan', 'off the plan']],
    ['House and land', ['house and land', 'house-and-land']],
    ['Vacant land', ['vacant land', 'land to build', 'build a home']],
    ['Apartment/Unit', ['apartment', 'unit']],
    ['Townhouse', ['townhouse', 'town house']],
    ['Substantially renovated', ['substantially renovated']],
  ];
  const eligiblePropertyTypes = joinCell(
    typeMap.filter(([, kw]) => includesAny(text, kw)).map(([label]) => label)
  );

  // ── New vs established ─────────────────────────────────────────────────────
  const hasNew = includesAny(text, ['new home', 'newly built', 'newly constructed', 'new or substantially renovated']);
  const hasEstablished = includesAny(text, ['established home', 'existing home', 'existing dwelling', 'established dwelling']);
  let newVsEstablished = '';
  if (hasNew && hasEstablished) newVsEstablished = 'Both new and established';
  else if (hasNew) newVsEstablished = 'New homes only';
  else if (hasEstablished) newVsEstablished = 'Established homes eligible';

  // ── Minimum deposit ───────────────────────────────────────────────────────
  let minimumDeposit = '';
  const depMatch = text.match(/(\d{1,2}(?:\.\d)?)\s?%\s+deposit/i) ||
    text.match(/deposit\s+of\s+(?:as little as\s+)?(\d{1,2}(?:\.\d)?)\s?%/i) ||
    text.match(/(?:with|just|only)\s+(?:a\s+)?(\d{1,2}(?:\.\d)?)\s?%\s+deposit/i);
  if (depMatch) minimumDeposit = `${depMatch[1]}%`;

  // ── Prior ownership rules (canonical short value) ─────────────────────────
  let priorOwnershipRules = '';
  const ownsProperty = includesAny(text, ['owned property', 'owned a home', 'owned residential', 'held an interest', 'previously owned', 'prior ownership', 'not owned', 'never owned']);
  if (ownsProperty) {
    if (includesAny(text, ['last 10 years', 'past 10 years', 'previous 10 years', 'in the last ten years'])) {
      priorOwnershipRules = 'Must not have owned property in Australia in the last 10 years';
    } else {
      priorOwnershipRules = 'Must not have previously owned residential property in Australia';
    }
  }

  // ── Single parent ─────────────────────────────────────────────────────────
  const singleParentRequired = yesIf(text, ['single parent', 'single legal guardian', 'sole parent']);

  // ── Dependent children ────────────────────────────────────────────────────
  const dependentChildrenRequired = includesAny(text, [
    'dependent child',
    'at least one dependent',
    'dependent children',
  ])
    ? 'Yes'
    : '';

  // ── Relationship status ───────────────────────────────────────────────────
  let relationshipStatus = '';
  if (includesAny(text, ['single parent', 'sole parent']))
    relationshipStatus = 'Single parent';
  else if (includesAny(text, ['single', 'couple', 'spouse', 'partner', 'de facto']))
    relationshipStatus = uniq(
      [
        includesAny(text, ['single']) ? 'Single' : '',
        includesAny(text, ['couple', 'spouse', 'partner', 'de facto']) ? 'Couple/partner' : '',
      ].filter(Boolean)
    ).join('; ');

  // ── Occupancy requirement ─────────────────────────────────────────────────
  let occupancyRequirement = '';
  const occMatch = text.match(/(?:live in|occupy|reside in)[^.]*?(\d{1,2})\s+(?:continuous\s+)?months/i) ||
    text.match(/(\d{1,2})\s+(?:continuous\s+)?months[^.]*?(?:live|occupy|reside)/i);
  if (occMatch) occupancyRequirement = `Must occupy for ${occMatch[1]} months`;
  else if (includesAny(text, ['principal place of residence', 'move into']))
    occupancyRequirement = 'Must occupy as principal place of residence';

  // ── Other conditions — ONE short, clean clause (never a paragraph dump) ───
  const otherConditions = joinCell(
    splitSentences(text)
      .filter((s) => includesAny(s, ['must not have', 'you cannot', 'ineligible if', 'not eligible if', 'you are not eligible']))
      .filter((s) => s.length >= 20 && s.length <= 140)
      .slice(0, 1)
  );

  return {
    firstHomeBuyerRequired,
    ownerOccupierRequired,
    citizenshipResidency,
    minimumAge,
    incomeCapSingle,
    incomeCapCouple,
    incomeTestBasis,
    propertyPriceCap,
    priceCapVariations,
    eligiblePropertyTypes,
    newVsEstablished,
    minimumDeposit,
    priorOwnershipRules,
    singleParentRequired,
    dependentChildrenRequired,
    relationshipStatus,
    occupancyRequirement,
    otherConditions,
  };
}

/** Detect income caps for single vs couple applicants. */
function extractIncomeCaps(text: string): {
  incomeCapSingle: string;
  incomeCapCouple: string;
  incomeTestBasis: string;
} {
  let incomeCapSingle = '';
  let incomeCapCouple = '';
  let incomeTestBasis = '';

  // Sentences mentioning income thresholds.
  const incomeSentences = sentencesWith(text, [
    'income cap',
    'income threshold',
    'income limit',
    'taxable income',
    'earn less than',
    'income of',
  ]);

  for (const s of incomeSentences) {
    const money = extractMoney(s);
    if (!money.length) continue;
    const ls = s.toLowerCase();
    if (includesAny(ls, ['single', 'individual', 'one applicant']) && !incomeCapSingle) {
      incomeCapSingle = formatMoney(money[0].value);
    }
    if (includesAny(ls, ['couple', 'joint', 'two applicants', 'combined']) && !incomeCapCouple) {
      // For couples, prefer the largest figure in the sentence.
      const max = money.reduce((a, b) => (b.value > a.value ? b : a));
      incomeCapCouple = formatMoney(max.value);
    }
    if (includesAny(ls, ['taxable income'])) incomeTestBasis = 'Taxable income';
    else if (includesAny(ls, ['gross income'])) incomeTestBasis = 'Gross income';
  }

  return { incomeCapSingle, incomeCapCouple, incomeTestBasis };
}

/** Detect a property price / value cap. */
function extractPriceCap(text: string): {
  propertyPriceCap: string;
  priceCapVariations: string;
} {
  // Exclude sentences about penalties/fees/repayment — their $ amounts are not
  // the property price cap.
  const PENALTY = ['penalt', 'fine', 'fined', 'fee', 'repay', 'interest', 'prosecut'];
  let propertyPriceCap = '';
  const capSentences = sentencesWith(text, [
    'property price cap',
    'price cap',
    'property value must',
    'value of the property',
    'purchase price',
    'value must not exceed',
    'dutiable value',
    'must not be more than',
    'must not exceed',
  ]).filter((s) => !includesAny(s, PENALTY));

  for (const s of capSentences) {
    if (!includesAny(s.toLowerCase(), ['cap', 'not exceed', 'up to', 'less than', 'not be more than', 'maximum'])) continue;
    // Property caps are large; ignore small figures (grants, fees) in-sentence.
    const money = extractMoney(s).filter((m) => m.value >= 100_000);
    if (money.length) {
      propertyPriceCap = formatMoney(money.reduce((a, b) => (b.value > a.value ? b : a)).value);
      break;
    }
  }

  // Variations by region → a SHORT list of the cap values, not raw sentences.
  const variationSentences = sentencesWith(text, ['capital city', 'regional', 'metropolitan', 'rest of state', 'north of the', 'south of the'])
    .filter((s) => !includesAny(s, PENALTY));
  const capValues = uniq(
    variationSentences
      .flatMap((s) => extractMoney(s).filter((m) => m.value >= 100_000).map((m) => formatMoney(m.value)))
  ).slice(0, 3);
  const priceCapVariations = capValues.length >= 2 ? `Varies by location: ${capValues.join(', ')}` : '';

  return { propertyPriceCap, priceCapVariations };
}
