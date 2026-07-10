/**
 * Government AUTHORITIES — the discovery engine's real entry points.
 *
 * Instead of hand-listing scheme URLs (see sources.ts, now a fallback/seed),
 * discovery starts from each authority's landing/hub page(s) and crawls to find
 * scheme pages automatically. When a government renames or moves a page, the
 * crawler still finds it — no code change required.
 *
 * `allowPathPrefixes` bounds crawling on very large hosts (ato.gov.au,
 * wa.gov.au, nt.gov.au) to the relevant sections so the crawl stays tractable
 * and on-topic. Small, focused revenue-office sites omit it and crawl freely.
 *
 * To onboard a new authority: add one entry here. Nothing else needs editing.
 */
import type { Authority } from '../types';

export const AUTHORITIES: Authority[] = [
  // ── Federal ────────────────────────────────────────────────────────────────
  {
    id: 'housing-australia',
    name: 'Housing Australia',
    level: 'Federal',
    jurisdiction: 'FED',
    landingUrls: [
      'https://www.housingaustralia.gov.au/home-guarantee-scheme',
      'https://www.housingaustralia.gov.au/support-buy-home',
    ],
  },
  {
    id: 'ato',
    name: 'Australian Taxation Office',
    level: 'Federal',
    jurisdiction: 'FED',
    landingUrls: [
      'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/early-access-to-super',
    ],
    allowPathPrefixes: [
      '/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super',
    ],
  },

  // ── States & Territories ────────────────────────────────────────────────────
  {
    id: 'revenue-nsw',
    name: 'Revenue NSW',
    level: 'State',
    jurisdiction: 'NSW',
    landingUrls: ['https://www.revenue.nsw.gov.au/grants-schemes'],
    allowPathPrefixes: ['/grants-schemes'],
  },
  {
    id: 'sro-vic',
    name: 'State Revenue Office Victoria',
    level: 'State',
    jurisdiction: 'VIC',
    landingUrls: [
      'https://www.sro.vic.gov.au/first-home-owner',
      'https://www.sro.vic.gov.au/fhbduty',
    ],
    allowPathPrefixes: ['/first-home', '/fhb', '/grants', '/land-transfer'],
  },
  {
    id: 'qro',
    name: 'Queensland Revenue Office',
    level: 'State',
    jurisdiction: 'QLD',
    landingUrls: ['https://qro.qld.gov.au/property-concessions-grants/'],
    allowPathPrefixes: ['/property-concessions-grants', '/duties'],
  },
  {
    id: 'wa-treasury',
    name: 'RevenueWA (Department of Treasury and Finance)',
    level: 'State',
    jurisdiction: 'WA',
    landingUrls: [
      'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/first-home-owner-grant-fhog',
    ],
    allowPathPrefixes: [
      '/organisation/department-of-treasury-and-finance',
      '/government/publications',
      '/service/financial-management/taxation-and-duty',
    ],
  },
  {
    id: 'revenue-sa',
    name: 'RevenueSA',
    level: 'State',
    jurisdiction: 'SA',
    landingUrls: [
      'https://www.revenuesa.sa.gov.au/grants-and-concessions',
      'https://www.revenuesa.sa.gov.au/first-home-owners-grant',
    ],
    allowPathPrefixes: ['/grants-and-concessions', '/first-home', '/stampduty', '/FirstHomeOwnerGrant'],
  },
  {
    id: 'sro-tas',
    name: 'State Revenue Office Tasmania',
    level: 'State',
    jurisdiction: 'TAS',
    landingUrls: ['https://www.sro.tas.gov.au/first-home-owner'],
    allowPathPrefixes: ['/first-home', '/property', '/duty'],
  },
  {
    id: 'act-revenue',
    name: 'ACT Revenue Office',
    level: 'Territory',
    jurisdiction: 'ACT',
    landingUrls: ['https://www.revenue.act.gov.au/home-buyer-assistance'],
    allowPathPrefixes: ['/home-buyer-assistance', '/duties', '/grants'],
  },
  {
    id: 'nt-treasury',
    name: 'Northern Territory — Territory Revenue Office',
    level: 'Territory',
    jurisdiction: 'NT',
    landingUrls: ['https://treasury.nt.gov.au/dtf/territory-revenue-office'],
    allowPathPrefixes: ['/dtf/territory-revenue-office'],
  },
];

/** Host(s) a crawl may traverse for a given authority (derived from landings). */
export function authorityHosts(authority: Authority): Set<string> {
  const hosts = new Set<string>();
  for (const u of authority.landingUrls) {
    try {
      hosts.add(new URL(u).hostname.toLowerCase());
    } catch {
      /* ignore malformed landing */
    }
  }
  return hosts;
}
