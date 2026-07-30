/**
 * FirstNest — Common Eligibility Questionnaire (NSW & VIC)
 * Answer model + option sets. Source of truth: the NSW & Victoria questionnaire
 * Excel (21 questions C01–C17, N01, V01–V03). Q IDs are the stable backend
 * identifiers; the step grouping below is presentation-only.
 *
 * This is a FRONTEND redesign — no API/DB/engine contract changes. The answers
 * here are mapped down to the existing eligibility query in `logic.ts`.
 */

export type YesNo = 'Yes' | 'No'
export type StateCode = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'ACT'

export const CITIZENSHIP_OPTIONS = [
  'Australian Citizen',
  'Permanent Resident',
  'NZ Special Category Visa (SCV) holder',
  'Other',
] as const
export type Citizenship = (typeof CITIZENSHIP_OPTIONS)[number]

export const PROPERTY_TYPE_OPTIONS = [
  'New',
  'Established (Existing)',
  'Off-the-Plan',
  'Land + Build',
] as const
export type PropertyType = (typeof PROPERTY_TYPE_OPTIONS)[number]

export const PURCHASE_ENTITY_OPTIONS = ['Individual', 'Company', 'Trust'] as const
export type PurchaseEntity = (typeof PURCHASE_ENTITY_OPTIONS)[number]

export const BUYING_WITH_OPTIONS = ['Individually', 'Jointly'] as const
export type BuyingWith = (typeof BUYING_WITH_OPTIONS)[number]

export const FAMILY_VIOLENCE_OPTIONS = ['Yes', 'No', 'Prefer not to say'] as const
export type FamilyViolence = (typeof FAMILY_VIOLENCE_OPTIONS)[number]

/** Full answer set — one field per Excel question (Q ID in the comment). */
export interface Answers {
  // ── Getting started ──
  name: string                           // personalisation (not an Excel Q)

  // ── About You ──
  is18: YesNo | ''                       // C01
  buyingWith: BuyingWith | ''            // C02
  citizenship: Citizenship | ''          // C04
  coCitizenship: Citizenship | ''        // C05  (if Jointly)
  coDob: string                          // C03  (if Jointly) — ISO yyyy-mm-dd
  everOwned: YesNo | ''                  // C06
  hasPartner: YesNo | ''                 // C07
  partnerOwned: YesNo | ''               // C08  (if C07 = Yes)
  priorBenefit: YesNo | ''               // C09

  // ── Property ──
  propertyType: PropertyType | ''        // C12
  price: number | null                   // C13
  suburb: string                         // C14
  postcode: string                       // C14
  state: StateCode | ''                  // C14 (inferred from postcode)
  ppr: YesNo | ''                        // C10
  moveIn: YesNo | ''                     // C11  (if C10 = Yes)
  entity: PurchaseEntity | ''            // C17

  // ── Income ──
  income: number | null                  // C15
  coIncome: number | null                // C16  (if Jointly)

  // ── NSW-specific ──
  nswNeverOccupied: YesNo | ''           // N01

  // ── QLD-specific ──
  // Q01 — RETIRED by product decision. No longer asked, validated or read by the
  // rules engine; Property Type = "New" now represents a Queensland new home.
  // The field is kept so stored answers and API payloads keep their exact shape.
  qldNeverOccupied: YesNo | ''           // Q01  (retired)

  // ── VIC-specific ──
  vicLivedInPrior: YesNo | ''            // V01  (if VIC & everOwned = Yes)
  vicAdf: YesNo | ''                     // V02  (if VIC)
  vicFamilyViolence: FamilyViolence | '' // V03  (if VIC)
  
  // ── Additional ──
  deposit: number | null
}

export const EMPTY_ANSWERS: Answers = {
  name: '',
  is18: '',
  buyingWith: '',
  citizenship: '',
  coCitizenship: '',
  coDob: '',
  everOwned: '',
  hasPartner: '',
  partnerOwned: '',
  priorBenefit: '',
  propertyType: '',
  price: null,
  deposit: null,
  suburb: '',
  postcode: '',
  state: '',
  ppr: '',
  moveIn: '',
  entity: '',
  income: null,
  coIncome: null,
  nswNeverOccupied: '',
  qldNeverOccupied: '',
  vicLivedInPrior: '',
  vicAdf: '',
  vicFamilyViolence: '',
}

export type StepId = 'start' | 'property' | 'about' | 'history' | 'income' | 'review'

export interface StepMeta {
  id: StepId
  eyebrow: string
  title: string
  sub: string
  mini: string
}

/** The five input steps (results is rendered separately, progress hidden). */
export const STEP_META: Record<Exclude<StepId, 'review'>, StepMeta> = {
  start: {
    id: 'start', eyebrow: 'Let’s get started', mini: 'Getting started',
    title: 'Let’s find every grant you qualify for 🏛️',
    sub: 'We’ll start with a couple of basics, then match you against every NSW & VIC first-home buyer scheme.',
  },
  property: {
    id: 'property', eyebrow: 'The property', mini: 'The property',
    title: 'Tell us about the property',
    sub: 'We’ll check this against price caps and scheme rules.',
  },
  about: {
    id: 'about', eyebrow: 'About you', mini: 'About you',
    title: 'A little about you',
    sub: 'Age, residency and buying structure all affect which grants you can access.',
  },
  history: {
    id: 'history', eyebrow: 'About you', mini: 'Ownership history',
    title: 'Ownership history',
    sub: 'This confirms your first-home buyer status and rules out duplicate claims.',
  },
  income: {
    id: 'income', eyebrow: 'Income', mini: 'Income & money',
    title: 'Income & money',
    sub: 'Some schemes are income-tested — this is the last step before your results.',
  },
}

export const INPUT_STEPS: Exclude<StepId, 'review'>[] = ['start', 'property', 'about', 'history', 'income']
