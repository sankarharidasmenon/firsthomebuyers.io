/**
 * Shared type definitions for the extraction engine.
 */

export type SchemeType =
  | 'Grant'
  | 'Concession'
  | 'Stamp Duty Relief'
  | 'Guarantee'
  | 'Tax Benefit'
  | 'Shared Equity'
  | 'Unknown';

export type GovLevel = 'Federal' | 'State' | 'Territory';

/** A government authority whose site is crawled starting from landing page(s). */
export interface Authority {
  /** Stable id, e.g. "revenue-nsw". */
  id: string;
  name: string;
  level: GovLevel;
  /** State/territory code, or "FED" for federal. */
  jurisdiction: string;
  /** One or more landing/hub pages to begin crawling from. */
  landingUrls: string[];
  /**
   * Optional path-prefix allowlist. When set, only links whose pathname starts
   * with one of these prefixes are crawled — keeps large sites (wa.gov.au,
   * ato.gov.au) bounded and on-topic. When omitted, the whole host is crawled.
   */
  allowPathPrefixes?: string[];
}

/** A page visited by the crawler, with the signals the classifier needs. */
export interface CrawledPage {
  url: string;
  canonicalUrl?: string;
  title: string;
  h1: string;
  metaDescription: string;
  /** SHA-256 of normalized visible text. */
  contentHash: string;
  lastModified?: string;
  etag?: string;
  depth: number;
  authorityId: string;
  /** Same-host PDF links found on the page (attached to the parent scheme). */
  pdfLinks: string[];
}

/** The allowed First Home Buyer scheme categories. */
export type FhbCategory =
  | 'First Home Owner Grants'
  | 'Government Guarantees'
  | 'Shared Equity Programs'
  | 'Stamp Duty Assistance'
  | 'Deposit Assistance'
  | 'Government Housing Purchase Programs'
  | 'First Home Buyer Tax Benefits'
  | 'First Home Buyer Support';

/** A page the domain filter rejected, with a human-readable reason. */
export interface RejectedPage {
  url: string;
  title: string;
  reason: string;
}

/** Output of the page classifier. */
export interface ClassificationResult {
  confidence: number; // 0–100
  matched: string[];
  disqualified: boolean;
  reason: string;
  dominantType?: SchemeType;
}

export type DiscoveryStatus = 'new' | 'existing' | 'updated' | 'retired' | 'renamed';

/** A discovered candidate scheme page (row in discovered_sources.json). */
export interface DiscoveredSource {
  authority: string;
  authorityId: string;
  jurisdiction: string;
  level: GovLevel;
  url: string;
  title: string;
  confidence: number;
  status: DiscoveryStatus;
  contentHash: string;
  lastModified?: string;
  etag?: string;
  /** Id of the matching hand-configured source, if any. */
  matchedKnownId?: string;
  typeHint?: SchemeType;
  /** Deterministic FHB category the page was matched into. */
  category?: FhbCategory;
  /** Why this page was included (matched phrase → category). */
  reason?: string;
  /** Sub-pages (eligibility/apply/FAQ/forms/…) merged into this one scheme. */
  relatedPages?: string[];
  /** PDF URLs found on the scheme's page(s). */
  pdfUrls?: string[];
  discoveredAt: string;
}

/** A single configured government source (one program on one official page). */
export interface Source {
  /** Stable, human-readable id, e.g. "nsw-fhog". */
  id: string;
  /** Official program name as advertised. */
  programName: string;
  administeringBody: string;
  level: GovLevel;
  /** State/territory code, or "FED" for federal. */
  jurisdiction: string;
  /** Primary official page URL (must be *.gov.au). */
  url: string;
  /** Optional RSS/Atom feed to check first. */
  rss?: string;
  /** Hint for the scheme type when the page text is ambiguous. */
  typeHint?: SchemeType;
}

/** Result of fetching a page, including change-detection metadata. */
export interface FetchedPage {
  url: string;
  status: number;
  html: string;
  contentHash: string;
  lastModified?: string;
  etag?: string;
  fetchedAt: string;
  /** Absolute URLs of PDFs linked from the page. */
  pdfLinks: string[];
}

/** Persisted change-detection record per URL. */
export interface ChangeRecord {
  url: string;
  contentHash: string;
  lastModified?: string;
  etag?: string;
  lastCheckedAt: string;
  lastChangedAt: string;
}

/**
 * One extracted scheme = one Excel row.
 * Keys map 1:1 to the required Excel columns (see excelExporter for ordering).
 */
export interface SchemeRecord {
  schemeId: string;
  schemeName: string;
  acronym: string;
  type: string;
  level: string;
  administeringBody: string;
  shortDescription: string;
  detailedDescription: string;
  applicableStates: string;
  metroVsRegional: string;
  postcodeRegionRestrictions: string;
  benefitType: string;
  benefitValue: string;
  valueUnit: string;
  maxValueCap: string;
  stateByStateValueVariations: string;
  regionalBonusAmount: string;
  valueCalculationMethod: string;
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
  fullExemptionThreshold: string;
  partialConcessionRange: string;
  concessionCalculationMethod: string;
  canBeCombinedWith: string;
  mutuallyExclusiveWith: string;
  placesQuota: string;
  status: string;
  startDate: string;
  endClosingDate: string;
  contractDateWindow: string;
  financialYear: string;
  officialUrl: string;
  legislationReference: string;
  applicationMethod: string;
  lastVerifiedDate: string;
  sourceWebsite: string;
  notesCaveats: string;
  eligibilityTag: string;
  priorityRanking: string;
  catchyLine: string;
}
