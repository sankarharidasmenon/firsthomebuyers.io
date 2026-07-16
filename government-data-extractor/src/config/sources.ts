/**
 * Official government sources — ONE entry per scheme/program.
 *
 * Rules:
 *  - Only *.gov.au (and the official Housing Australia domain) are allowed.
 *  - Each URL points at the canonical program page.
 *  - `rss` is set only where an official feed is known; otherwise the website
 *    collector is used.
 *
 * URLs are verified against the change detector on every run; if a department
 * restructures its site, update the URL here (single source of truth).
 */
import type { Source } from '../types';

export const SOURCES: Source[] = [
  // ── Federal — firsthomebuyers.gov.au (was Housing Australia) ─────────────
  // The three separate guarantee programs (First Home Guarantee, Family Home
  // Guarantee, Regional First Home Buyer Guarantee) were consolidated into a
  // single "5% Deposit Scheme" as of October 2025. No income caps, no waitlist.
  {
    id: 'fed-5-percent-deposit-scheme',
    programName: 'Australian Government 5% Deposit Scheme',
    administeringBody: 'Housing Australia',
    level: 'Federal',
    jurisdiction: 'FED',
    url: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme',
    typeHint: 'Guarantee',
  },
  {
    id: 'fed-help-to-buy',
    programName: 'Help to Buy',
    administeringBody: 'Housing Australia',
    level: 'Federal',
    jurisdiction: 'FED',
    // Applications opened 5 December 2025. 10,000 places/year.
    url: 'https://firsthomebuyers.gov.au/australian-government-help-buy-scheme',
    typeHint: 'Shared Equity',
  },

  // ── Federal — ATO (via firsthomebuyers.gov.au — ATO blocks crawlers) ──────
  {
    id: 'fed-first-home-super-saver',
    programName: 'First Home Super Saver Scheme',
    administeringBody: 'Australian Taxation Office',
    level: 'Federal',
    jurisdiction: 'FED',
    url: 'https://firsthomebuyers.gov.au/first-home-super-saver-scheme',
    typeHint: 'Tax Benefit',
  },

  // ── NSW — Revenue NSW ──────────────────────────────────────────────────────
  {
    id: 'nsw-first-home-owner-grant',
    programName: 'First Home Owner Grant (New Homes)',
    administeringBody: 'Revenue NSW',
    level: 'State',
    jurisdiction: 'NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-owner-new-homes-grant',
    typeHint: 'Grant',
  },
  {
    id: 'nsw-first-home-buyers-assistance',
    programName: 'First Home Buyers Assistance Scheme',
    administeringBody: 'Revenue NSW',
    level: 'State',
    jurisdiction: 'NSW',
    url: 'https://www.revenue.nsw.gov.au/grants-schemes/assistance-scheme',
    typeHint: 'Concession',
  },

  // ── Victoria — State Revenue Office ────────────────────────────────────────
  {
    id: 'vic-first-home-owner-grant',
    programName: 'First Home Owner Grant',
    administeringBody: 'State Revenue Office Victoria',
    level: 'State',
    jurisdiction: 'VIC',
    url: 'https://www.sro.vic.gov.au/first-home-owner',
    typeHint: 'Grant',
  },
  {
    id: 'vic-first-home-buyer-duty-exemption',
    programName: 'First Home Buyer Duty Exemption, Concession or Reduction',
    administeringBody: 'State Revenue Office Victoria',
    level: 'State',
    jurisdiction: 'VIC',
    url: 'https://www.sro.vic.gov.au/fhbduty',
    typeHint: 'Stamp Duty Relief',
  },

  // ── Queensland — Queensland Revenue Office ─────────────────────────────────
  {
    id: 'qld-first-home-owner-grant',
    programName: 'First Home Owner Grant',
    administeringBody: 'Queensland Revenue Office',
    level: 'State',
    jurisdiction: 'QLD',
    url: 'https://qro.qld.gov.au/property-concessions-grants/first-home-grant/',
    typeHint: 'Grant',
  },
  {
    id: 'qld-first-home-transfer-duty-concession',
    programName: 'First Home Transfer Duty Concession',
    administeringBody: 'Queensland Revenue Office',
    level: 'State',
    jurisdiction: 'QLD',
    url: 'https://qro.qld.gov.au/duties/transfer-duty/concessions/homes/first-home/',
    typeHint: 'Concession',
  },

  // ── Western Australia — RevenueWA ──────────────────────────────────────────
  {
    id: 'wa-first-home-owner-grant',
    programName: 'First Home Owner Grant',
    administeringBody: 'RevenueWA',
    level: 'State',
    jurisdiction: 'WA',
    url: 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/first-home-owner-grant-fhog',
    typeHint: 'Grant',
  },
  {
    id: 'wa-first-home-owner-rate-of-duty',
    programName: 'First Home Owner Rate of Duty',
    administeringBody: 'RevenueWA',
    level: 'State',
    jurisdiction: 'WA',
    url: 'https://www.wa.gov.au/government/publications/duties-fact-sheet-first-home-owner-rate',
    typeHint: 'Stamp Duty Relief',
  },

  // ── South Australia — RevenueSA ────────────────────────────────────────────
  {
    id: 'sa-first-home-owner-grant',
    programName: 'First Home Owner Grant',
    administeringBody: 'RevenueSA',
    level: 'State',
    jurisdiction: 'SA',
    url: 'https://www.revenuesa.sa.gov.au/first-home-owners-grant',
    typeHint: 'Grant',
  },

  // ── Tasmania — State Revenue Office ────────────────────────────────────────
  {
    id: 'tas-first-home-owner-grant',
    programName: 'First Home Owner Grant',
    administeringBody: 'State Revenue Office Tasmania',
    level: 'State',
    jurisdiction: 'TAS',
    url: 'https://www.sro.tas.gov.au/first-home-owner',
    typeHint: 'Grant',
  },

  // ── ACT — ACT Revenue Office ───────────────────────────────────────────────
  {
    id: 'act-home-buyer-concession',
    programName: 'Home Buyer Concession Scheme',
    administeringBody: 'ACT Revenue Office',
    level: 'Territory',
    jurisdiction: 'ACT',
    url: 'https://www.revenue.act.gov.au/home-buyer-assistance/home-buyer-concession-scheme',
    typeHint: 'Concession',
  },

  // ── Northern Territory — NT Government ─────────────────────────────────────
  {
    id: 'nt-homegrown-territory-grant',
    programName: 'HomeGrown Territory Grant',
    administeringBody: 'Northern Territory Government',
    level: 'Territory',
    jurisdiction: 'NT',
    // nt.gov.au sits behind CDN bot-protection (403 to HTTP clients); the
    // Territory Revenue Office guide on treasury.nt.gov.au carries the same
    // official detail and is reachable.
    url: 'https://treasury.nt.gov.au/dtf/territory-revenue-office/homegrown-territory-guide-grants',
    typeHint: 'Grant',
  },
];

/** Allowed host suffixes. Anything else is refused by the downloader. */
export const ALLOWED_HOST_SUFFIXES = ['.gov.au', 'firsthomebuyers.gov.au'];

export function isOfficialHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix));
}
