/**
 * Source configuration.
 *
 * ALLOWED_DOMAINS  — the ONLY hosts the crawler will fetch. Anything else is skipped
 *                    and logged. This is the hard guarantee that only official
 *                    government sources are used.
 *
 * SEEDS            — official entry points (hub/landing pages) per jurisdiction.
 *                    Individual scheme pages are DISCOVERED by crawling these hubs and
 *                    following in-scheme links (overview / eligibility / benefits /
 *                    apply / faqs). We do NOT hardcode scheme *content* — only the
 *                    official starting URLs and the deterministic Grant/Scheme type,
 *                    per the spec's "Program Type Rules" (types are never invented).
 */

import type { ProgramType, StateValue } from '../types';

export interface Seed {
  id: string;
  seedName: string;
  programType: ProgramType; // UI/UX Program Type — only 'Grant' or 'Scheme'
  /** Detailed benefit type (reference "Type" column): Grant/Guarantee/Shared Equity/Tax Benefit/Concession/Stamp Duty Relief */
  detailedType: string;
  acronym: string;
  jurisdiction: StateValue;
  governmentLevel: 'Federal' | 'State';
  department: string;
  agency: string; // Administering Body
  url: string;
  /** Official property-price-cap page (federal schemes) whose per-state table is scraped */
  capsUrl?: string;
  /** hub/index page whose child links should be crawled to discover more schemes */
  isHub?: boolean;
  /** hub used ONLY for discovery — not itself emitted as a scheme row */
  hubOnly?: boolean;
}

/** Only these domains (matched by suffix) are ever fetched. */
export const ALLOWED_DOMAINS: string[] = [
  'gov.au',
  'nsw.gov.au',
  'revenue.nsw.gov.au',
  'vic.gov.au',
  'sro.vic.gov.au',
  'treasury.gov.au',
  'business.gov.au',
  'housing.gov.au',
  'housingaustralia.gov.au',
  'ato.gov.au',
  'nhfic.gov.au',
];

/** Blocklist — even if a URL slips through, never fetch these (non-government / noise). */
export const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /finder|canstar|realestate|domain\.com|mortgage|facebook|twitter|linkedin|instagram|youtube|google|bing/i,
];

/**
 * Keywords that qualify a discovered page as a First-Home-Buyer scheme/grant page.
 * Used by the classifier during discovery.
 */
export const FHB_KEYWORDS: RegExp[] = [
  /first[\s-]?home\s+(owner|buyer|guarantee)/i,
  /first\s+home\s+owner\s+grant/i,
  /home\s+guarantee\s+scheme/i,
  /help\s+to\s+buy/i,
  /shared\s+equity/i,
  /homebuyer\s+fund/i,
  /first\s+home\s+super\s+saver/i,
  /duty\s+(exemption|concession|reduction).*(first\s+home|home\s+buyer)/i,
  /first\s+home\s+buyers?\s+assistance/i,
];

export const SEEDS: Seed[] = [
  // ═══════════════════════════ FEDERAL (3 schemes) ═══════════════════════════
  // Single row each ("All States & Territories"). Their per-state PROPERTY PRICE
  // CAPS are scraped from the official caps pages and written to the
  // "Price Cap Variations" / "State-by-State Value Variations" columns.
  {
    id: 'fed-first-home-buyers-hub',
    seedName: 'Australian Government First Home Buyer support',
    programType: 'Scheme',
    detailedType: 'Scheme',
    acronym: '',
    jurisdiction: 'Australia',
    governmentLevel: 'Federal',
    department: 'The Treasury',
    agency: 'Housing Australia',
    url: 'https://firsthomebuyers.gov.au/',
    isHub: true,
    hubOnly: true,
  },
  {
    id: 'fed-first-home-guarantee',
    seedName: 'First Home Guarantee',
    programType: 'Scheme',
    detailedType: 'Guarantee',
    acronym: 'FHBG',
    jurisdiction: 'Australia',
    governmentLevel: 'Federal',
    department: 'The Treasury',
    agency: 'Housing Australia',
    url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme',
    capsUrl:
      'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps',
  },
  {
    id: 'fed-help-to-buy',
    seedName: 'Help to Buy',
    programType: 'Scheme',
    detailedType: 'Shared Equity',
    acronym: 'HTB',
    jurisdiction: 'Australia',
    governmentLevel: 'Federal',
    department: 'The Treasury',
    agency: 'Housing Australia',
    url: 'https://firsthomebuyers.gov.au/australian-government-help-buy-scheme',
    capsUrl:
      'https://firsthomebuyers.gov.au/help-buy-tools-and-resources/help-buy-property-price-caps',
  },
  {
    id: 'fed-first-home-super-saver',
    seedName: 'First Home Super Saver Scheme',
    programType: 'Scheme',
    detailedType: 'Tax Benefit',
    acronym: 'FHSSS',
    jurisdiction: 'Australia',
    governmentLevel: 'Federal',
    department: 'The Treasury',
    agency: 'Australian Taxation Office',
    url: 'https://firsthomebuyers.gov.au/first-home-super-saver-scheme',
  },

  // ═══════════════════════════ NSW (3 schemes) ═══════════════════════════
  {
    id: 'nsw-first-home-buyer-hub',
    seedName: 'NSW First Home Buyer',
    programType: 'Scheme',
    detailedType: 'Scheme',
    acronym: '',
    jurisdiction: 'NSW',
    governmentLevel: 'State',
    department: 'NSW Treasury',
    agency: 'Revenue NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer',
    isHub: true,
    hubOnly: true,
  },
  {
    id: 'nsw-first-home-owner-grant',
    seedName: 'First Home Owner Grant NSW',
    programType: 'Grant',
    detailedType: 'Grant',
    acronym: 'FHOG',
    jurisdiction: 'NSW',
    governmentLevel: 'State',
    department: 'NSW Treasury',
    agency: 'Revenue NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-owner-new-homes-grant',
  },
  {
    id: 'nsw-first-home-buyers-assistance',
    seedName: 'First Home Buyers Assistance Scheme NSW',
    programType: 'Scheme',
    detailedType: 'Concession',
    acronym: 'FHBAS',
    jurisdiction: 'NSW',
    governmentLevel: 'State',
    department: 'NSW Treasury',
    agency: 'Revenue NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/assistance-scheme',
  },
  {
    id: 'nsw-shared-equity-home-buyer-helper',
    seedName: 'Shared Equity Home Buyer Helper NSW',
    programType: 'Scheme',
    detailedType: 'Shared Equity',
    acronym: 'SEHBH',
    jurisdiction: 'NSW',
    governmentLevel: 'State',
    department: 'NSW Treasury',
    agency: 'Revenue NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/approved-shared-equity-schemes',
  },

  // ═══════════════════════════ VICTORIA (3 schemes) ═══════════════════════════
  {
    id: 'vic-first-home-owner-grant',
    seedName: 'First Home Owner Grant VIC',
    programType: 'Grant',
    detailedType: 'Grant',
    acronym: 'FHOG',
    jurisdiction: 'Victoria',
    governmentLevel: 'State',
    department: 'Department of Treasury and Finance (Victoria)',
    agency: 'State Revenue Office Victoria',
    url: 'https://www.sro.vic.gov.au/first-home-owner',
  },
  {
    id: 'vic-first-home-buyer-duty-exemption',
    seedName: 'First Home Buyer Duty Exemption or Concession VIC',
    programType: 'Scheme',
    detailedType: 'Stamp Duty Relief',
    acronym: 'FBDEC',
    jurisdiction: 'Victoria',
    governmentLevel: 'State',
    department: 'Department of Treasury and Finance (Victoria)',
    agency: 'State Revenue Office Victoria',
    url: 'https://www.sro.vic.gov.au/fhbduty',
  },
  {
    id: 'vic-homebuyer-fund',
    seedName: 'Victorian Homebuyer Fund VIC',
    programType: 'Scheme',
    detailedType: 'Shared Equity',
    acronym: 'VHF',
    jurisdiction: 'Victoria',
    governmentLevel: 'State',
    department: 'Department of Treasury and Finance (Victoria)',
    agency: 'State Revenue Office Victoria',
    url: 'https://www.sro.vic.gov.au/homebuyer',
  },
];
