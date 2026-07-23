/**
 * Discovery + collection.
 *
 * For each configured seed:
 *   1. Fetch the primary scheme page.
 *   2. Follow in-scheme section links (eligibility / apply / benefits / faqs /
 *      guidelines / forms / legislation) up to a bounded depth.
 *   3. Parse all linked PDFs.
 *
 * For hub seeds additionally:
 *   4. Scan for OTHER First-Home-Buyer scheme links and register them as newly
 *      discovered schemes (so we don't hardcode the full scheme list).
 *
 * Returns one SchemeBundle per distinct scheme (multi-page merged later).
 */

import pLimit from 'p-limit';
import { SEEDS, Seed } from '../config/sources';
import { fetchPage, normalize } from '../core/fetchPage';
import { fetchPdf } from '../parse/pdfParser';
import { isFhbCandidate, inferProgramType, isSectionLink, isSectionAnchor, cleanSchemeName } from './classify';
import { log } from '../core/logger';
import type { FetchedPage, FetchedPdf, SchemeBundle } from '../types';

const MAX_SECTION_PAGES = 8;
const MAX_PDFS_PER_SCHEME = 6;
const MAX_DISCOVERED_PER_HUB = 8;

export async function discoverAndCollect(): Promise<SchemeBundle[]> {
  const bundles = new Map<string, SchemeBundle>();
  const hubPagesById = new Map<string, FetchedPage>(); // for hubOnly discovery
  const claimedUrls = new Set<string>(); // primary urls already assigned to a scheme
  const claimedPaths: string[] = []; // path prefixes owned by a scheme

  // Seeds define the known official entry points.
  for (const seed of SEEDS) {
    claimedUrls.add(normalize(seed.url));
    if (!seed.hubOnly) claimedPaths.push(safePath(seed.url).toLowerCase());
  }

  // ── Pass 1: collect each seed. hubOnly seeds are fetched for discovery but
  //            NOT emitted as scheme rows. ──
  for (const seed of SEEDS) {
    const bundle = await collectScheme(seed);
    if (!bundle) continue;
    if (seed.hubOnly) {
      if (bundle.pages[0]) hubPagesById.set(seed.id, bundle.pages[0]);
    } else {
      bundles.set(seed.id, bundle);
      if (seed.isHub && bundle.pages[0]) hubPagesById.set(seed.id, bundle.pages[0]);
    }
  }

  // ── Pass 2: hub discovery for additional schemes ──
  for (const seed of SEEDS.filter((s) => s.isHub)) {
    const hubPage = hubPagesById.get(seed.id);
    if (!hubPage) continue;

    let discovered = 0;
    for (const link of hubPage.links) {
      if (discovered >= MAX_DISCOVERED_PER_HUB) break;
      const key = normalize(link);
      if (claimedUrls.has(key)) continue;
      const anchor = anchorFor(hubPage, link);
      if (!isFhbCandidate(anchor, link)) continue;
      // Skip sub-page/action links — these are sections of a scheme, not schemes.
      if (isSectionAnchor(anchor)) continue;
      // Skip links that live under an already-claimed scheme's path.
      const lp = safePath(link).toLowerCase();
      if (claimedPaths.some((cp) => cp.length > 1 && lp.startsWith(cp))) continue;

      claimedUrls.add(key);
      claimedPaths.push(lp);
      const name = cleanSchemeName(anchor) || 'First Home Buyer Scheme';
      const progType = inferProgramType(name);
      const childSeed: Seed = {
        id: `${seed.jurisdiction.toLowerCase()}-discovered-${slug(name)}`,
        seedName: name,
        programType: progType,
        detailedType: progType, // best-effort; refined by extraction
        acronym: '',
        jurisdiction: seed.jurisdiction,
        governmentLevel: seed.governmentLevel,
        department: seed.department,
        agency: seed.agency,
        url: link,
      };
      if (bundles.has(childSeed.id)) continue;
      const b = await collectScheme(childSeed);
      if (b && b.pages[0] && looksLikeScheme(b.pages[0])) {
        bundles.set(childSeed.id, b);
        discovered++;
        log.info(`Discovered scheme via hub ${seed.id}: "${name}" -> ${link}`);
      }
    }
  }

  return [...bundles.values()];
}

/** Fetch a scheme's primary page + section pages + PDFs into a bundle. */
async function collectScheme(seed: Seed): Promise<SchemeBundle | null> {
  const primary = await fetchPage(seed.url);
  if (!primary) {
    log.warn(`Could not fetch primary page for ${seed.id}: ${seed.url}`);
    return null;
  }

  const pages: FetchedPage[] = [primary];
  const parentPath = safePath(primary.finalUrl);

  // Select in-scheme section links
  const sectionLinks: string[] = [];
  const seen = new Set<string>([normalize(primary.finalUrl), normalize(seed.url)]);
  for (const link of primary.links) {
    const key = normalize(link);
    if (seen.has(key)) continue;
    const anchor = anchorFor(primary, link);
    if (isSectionLink(anchor, link, parentPath)) {
      seen.add(key);
      sectionLinks.push(link);
    }
    if (sectionLinks.length >= MAX_SECTION_PAGES) break;
  }

  const limit = pLimit(2);
  const fetched = await Promise.all(
    sectionLinks.map((l) => limit(() => fetchPage(l)))
  );
  for (const p of fetched) if (p) pages.push(p);

  // Official per-state price-cap page (federal schemes) — scraped for variations
  let capsText = '';
  let capsHtml = '';
  if (seed.capsUrl) {
    const capsPage = await fetchPage(seed.capsUrl);
    if (capsPage) {
      capsText = capsPage.text;
      capsHtml = capsPage.html;
      pages.push(capsPage);
    } else {
      log.warn(`Could not fetch caps page for ${seed.id}: ${seed.capsUrl}`);
    }
  }

  // PDFs across all pages
  const pdfUrls = new Set<string>();
  for (const p of pages) for (const pl of p.pdfLinks) pdfUrls.add(pl);
  const pdfs: FetchedPdf[] = [];
  for (const pu of [...pdfUrls].slice(0, MAX_PDFS_PER_SCHEME)) {
    const parsed = await fetchPdf(pu);
    if (parsed) pdfs.push(parsed);
  }

  return {
    id: seed.id,
    jurisdiction: seed.jurisdiction,
    governmentLevel: seed.governmentLevel,
    primaryUrl: primary.finalUrl,
    pages,
    pdfs,
    seedName: seed.seedName,
    seedProgramType: seed.programType,
    detailedType: seed.detailedType,
    acronym: seed.acronym,
    department: seed.department,
    agency: seed.agency,
    capsUrl: seed.capsUrl || '',
    capsText,
    capsHtml,
  };
}

/** Find anchor text for a given href on a page (best-effort, from raw HTML). */
function anchorFor(page: FetchedPage, href: string): string {
  // cheap: search the HTML for the href and grab nearby text
  const idx = page.html.indexOf(href.replace(page.finalUrl.replace(/\/[^/]*$/, ''), ''));
  // Fallback to regex on full html
  const re = new RegExp(
    `<a[^>]+href=["']([^"']*${escapeRe(lastSeg(href))}[^"']*)["'][^>]*>([\\s\\S]*?)</a>`,
    'i'
  );
  const m = page.html.match(re);
  if (m) return stripTags(m[2]);
  return '';
}

function looksLikeScheme(page: FetchedPage): boolean {
  return page.text.length > 400;
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '/';
  }
}
function lastSeg(url: string): string {
  try {
    const p = new URL(url).pathname.replace(/\/$/, '');
    return p.split('/').pop() || p;
  } catch {
    return url;
  }
}
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
