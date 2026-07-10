/**
 * Government discovery orchestrator (Phase 1.6 — deterministic, no AI).
 *
 *   For each authority:
 *     crawl landing pages → apply the FHB domain filter (rule-based)
 *     → keep only first-home-buyer schemes → merge sub-pages into one record
 *     → emit DiscoveredSource[]  (+ a list of rejected pages with reasons)
 *
 * Status of each discovered scheme is worked out by comparing against:
 *   - the hand-configured SOURCES (matched → carries a known id / typeHint)
 *   - the PREVIOUS discovered_sources.json (to spot new / updated / retired)
 *
 * Persists discovered_sources.json and returns rich stats for reporting.
 */
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import type {
  Authority,
  CrawledPage,
  DiscoveredSource,
  DiscoveryStatus,
  FhbCategory,
  RejectedPage,
  SchemeType,
} from '../types';
import { AUTHORITIES } from '../config/authorities';
import { SOURCES } from '../config/sources';
import { crawlAuthority, CrawlOptions } from './linkCrawler';
import { evaluateDomain, isAdminPage } from './domainFilter';
import { DuplicateDetector, nameSimilarity } from './duplicateDetector';
import { normalizeUrl } from '../utils/helpers';
import { logger } from '../utils/logger';

const DISCOVERED_PATH = path.resolve(__dirname, '../../output/discovered_sources.json');

/** Map an FHB category to the extractor's scheme-type hint. */
function categoryToType(category?: FhbCategory): SchemeType | undefined {
  switch (category) {
    case 'First Home Owner Grants': return 'Grant';
    case 'Government Guarantees': return 'Guarantee';
    case 'Shared Equity Programs': return 'Shared Equity';
    case 'Stamp Duty Assistance': return 'Stamp Duty Relief';
    case 'First Home Buyer Tax Benefits': return 'Tax Benefit';
    default: return undefined;
  }
}

export interface AuthorityStats {
  authorityId: string;
  authority: string;
  jurisdiction: string;
  pagesCrawled: number;
  linksSeen: number;
  candidates: number; // relevant pages before sub-page merging
  discovered: number; // schemes after merging
  adminAttached: number; // admin/support pages folded into a parent scheme
  rejected: RejectedPage[]; // off-topic/archived/not-FHB pages with reasons
}

export interface DiscoveryStats {
  authoritiesCrawled: number;
  pagesCrawled: number;
  internalLinks: number;
  potentialSchemePages: number;
  discovered: number;
  newSchemes: number;
  existingSchemes: number;
  updatedSchemes: number;
  retiredSchemes: number;
  rejectedPages: number;
  perAuthority: AuthorityStats[];
}

export interface DiscoveryResult {
  discovered: DiscoveredSource[];
  retired: DiscoveredSource[];
  stats: DiscoveryStats;
}

export interface DiscoverOptions extends Partial<CrawlOptions> {
  /** Restrict to specific authority ids. */
  onlyAuthorities?: string[] | null;
  /** Authority-level concurrency (each authority also throttles internally). */
  authorityConcurrency?: number;
}

function loadPrevious(): DiscoveredSource[] {
  try {
    if (!fs.existsSync(DISCOVERED_PATH)) return [];
    return JSON.parse(fs.readFileSync(DISCOVERED_PATH, 'utf8')) as DiscoveredSource[];
  } catch (err) {
    logger.warn(`Could not read previous discovered_sources.json: ${(err as Error).message}`);
    return [];
  }
}

function persist(discovered: DiscoveredSource[]): void {
  const dir = path.dirname(DISCOVERED_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DISCOVERED_PATH, JSON.stringify(discovered, null, 2), 'utf8');
  logger.ok(`Wrote ${discovered.length} discovered source(s) → ${DISCOVERED_PATH}`);
}

/** Pathname of a URL (no trailing slash), or '' if unparseable. */
function pathOf(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/** Number of path segments — used to prefer shallower (canonical) pages. */
function pathDepth(url: string): number {
  return pathOf(url).split('/').filter(Boolean).length;
}

/**
 * Find a hand-configured source matching this URL or name.
 * URL match is global (URLs are unique); NAME match is restricted to the same
 * jurisdiction so e.g. an ACT "First Home Owner Grant" page is never mistaken
 * for Victoria's curated FHOG.
 */
function matchKnown(url: string, title: string, jurisdiction: string): string | undefined {
  const nurl = normalizeUrl(url);
  const byUrl = SOURCES.find((s) => normalizeUrl(s.url) === nurl);
  if (byUrl) return byUrl.id;
  const byName = SOURCES.find(
    (s) => s.jurisdiction === jurisdiction && nameSimilarity(s.programName, title) >= 0.82
  );
  return byName?.id;
}

/** Merge a sub-page (related/admin) into a kept scheme record. */
function attachRelated(scheme: DiscoveredSource, page: CrawledPage): void {
  scheme.relatedPages = scheme.relatedPages ?? [];
  scheme.pdfUrls = scheme.pdfUrls ?? [];
  const url = normalizeUrl(page.url);
  if (url !== scheme.url && !scheme.relatedPages.includes(url)) scheme.relatedPages.push(url);
  for (const pdf of page.pdfLinks) if (!scheme.pdfUrls.includes(pdf)) scheme.pdfUrls.push(pdf);
}

async function discoverAuthority(
  authority: Authority,
  previous: DiscoveredSource[],
  opts: DiscoverOptions
): Promise<{ discovered: DiscoveredSource[]; stats: AuthorityStats }> {
  const { pages, linksSeen } = await crawlAuthority(authority, opts);

  const dedupe = new DuplicateDetector();
  const discovered: DiscoveredSource[] = [];
  const keptMeta: { path: string; index: number }[] = [];
  const rejected: RejectedPage[] = [];
  const seenRejectUrls = new Set<string>();
  const adminPages: CrawledPage[] = [];
  let candidates = 0;
  let adminAttached = 0;

  // Apply the deterministic FHB domain filter to every crawled page.
  const evaluated = pages.map((page) => ({ page, verdict: evaluateDomain(page) }));

  // Partition non-relevant pages: admin → attach later; everything else → reject.
  for (const { page, verdict } of evaluated) {
    if (verdict.relevant) continue;
    if (isAdminPage(verdict)) {
      adminPages.push(page);
      continue;
    }
    const nurl = normalizeUrl(page.url);
    if (seenRejectUrls.has(nurl)) continue;
    seenRejectUrls.add(nurl);
    rejected.push({ url: nurl, title: page.title || page.h1, reason: verdict.reason });
    logger.debug(`Rejected [${verdict.kind}] ${page.url} — ${verdict.reason}`);
  }

  // Relevant pages: highest confidence first, then shallower path (canonical page).
  const relevant = evaluated
    .filter((e) => e.verdict.relevant)
    .sort((a, b) => b.verdict.confidence - a.verdict.confidence || pathDepth(a.page.url) - pathDepth(b.page.url));

  for (const { page, verdict } of relevant) {
    candidates++;
    const thisPath = pathOf(page.url);

    // One scheme = one record: a page under an already-kept scheme's path is a
    // sub-page (overview/eligibility/benefits/…) → merge it in, don't add a row.
    const parent = keptMeta.find((k) => thisPath !== k.path && thisPath.startsWith(k.path + '/'));
    if (parent) {
      attachRelated(discovered[parent.index], page);
      logger.debug(`Merged sub-page into parent scheme: ${page.url}`);
      continue;
    }

    // Fuzzy duplicate (same scheme reachable via a different URL) → merge in.
    const dup = dedupe.add({
      url: page.url,
      name: page.title || page.h1,
      contentHash: page.contentHash,
      jurisdiction: authority.jurisdiction,
    });
    if (dup.isDuplicate) {
      const target = discovered.find((d) => normalizeUrl(d.url) === normalizeUrl(dup.matchedTo!.url));
      if (target) attachRelated(target, page);
      logger.debug(`Merged duplicate (${dup.reason}) ${page.url} → ${dup.matchedTo?.url}`);
      continue;
    }

    const matchedKnownId = matchKnown(page.url, page.title || page.h1, authority.jurisdiction);
    const prior = previous.find(
      (p) => normalizeUrl(p.url) === normalizeUrl(page.url) || nameSimilarity(p.title, page.title) >= 0.82
    );

    let status: DiscoveryStatus;
    if (!prior) status = matchedKnownId ? 'existing' : 'new';
    else if (prior.contentHash !== page.contentHash) status = 'updated';
    else status = 'existing';
    if (prior && normalizeUrl(prior.url) === normalizeUrl(page.url) && nameSimilarity(prior.title, page.title) < 0.5) {
      status = 'renamed';
    }

    discovered.push({
      authority: authority.name,
      authorityId: authority.id,
      jurisdiction: authority.jurisdiction,
      level: authority.level,
      url: normalizeUrl(page.url),
      title: page.title || page.h1,
      confidence: verdict.confidence,
      status,
      contentHash: page.contentHash,
      lastModified: page.lastModified,
      etag: page.etag,
      matchedKnownId,
      typeHint: categoryToType(verdict.category),
      category: verdict.category,
      reason: verdict.reason,
      relatedPages: [],
      pdfUrls: [...page.pdfLinks],
      discoveredAt: new Date().toISOString(),
    });
    keptMeta.push({ path: thisPath, index: discovered.length - 1 });

    const tag =
      status === 'new' ? 'New scheme discovered' :
      status === 'updated' ? 'Existing scheme updated' :
      status === 'renamed' ? 'Scheme renamed' : 'Existing scheme';
    logger.ok(`${tag} [${authority.jurisdiction}] ${verdict.confidence}% ${verdict.category} — ${page.title || page.h1}`);
  }

  // Attach administrative/support pages to their parent scheme (by URL path).
  for (const page of adminPages) {
    const p = pathOf(page.url);
    const parent = keptMeta.find((k) => p.startsWith(k.path + '/'));
    if (parent) {
      attachRelated(discovered[parent.index], page);
      adminAttached++;
    }
  }

  const stats: AuthorityStats = {
    authorityId: authority.id,
    authority: authority.name,
    jurisdiction: authority.jurisdiction,
    pagesCrawled: pages.length,
    linksSeen,
    candidates,
    discovered: discovered.length,
    adminAttached,
    rejected,
  };
  return { discovered, stats };
}

export async function runDiscovery(opts: DiscoverOptions = {}): Promise<DiscoveryResult> {
  const authorities = opts.onlyAuthorities
    ? AUTHORITIES.filter((a) => opts.onlyAuthorities!.includes(a.id))
    : AUTHORITIES;

  const previous = loadPrevious();
  const limit = pLimit(opts.authorityConcurrency ?? 2);

  const results = await Promise.all(
    authorities.map((a) => limit(() => discoverAuthority(a, previous, opts)))
  );

  const discovered = results.flatMap((r) => r.discovered);
  const perAuthority = results.map((r) => r.stats);

  // Retired: previously discovered schemes no longer found this run.
  const foundUrls = new Set(discovered.map((d) => normalizeUrl(d.url)));
  const foundNames = discovered.map((d) => d.title);
  const retired: DiscoveredSource[] = previous
    .filter(
      (p) =>
        !foundUrls.has(normalizeUrl(p.url)) &&
        !foundNames.some((n) => nameSimilarity(n, p.title) >= 0.82)
    )
    .map((p) => ({ ...p, status: 'retired' as DiscoveryStatus }));

  const stats: DiscoveryStats = {
    authoritiesCrawled: authorities.length,
    pagesCrawled: perAuthority.reduce((s, a) => s + a.pagesCrawled, 0),
    internalLinks: perAuthority.reduce((s, a) => s + a.linksSeen, 0),
    potentialSchemePages: perAuthority.reduce((s, a) => s + a.candidates, 0),
    discovered: discovered.length,
    newSchemes: discovered.filter((d) => d.status === 'new').length,
    existingSchemes: discovered.filter((d) => d.status === 'existing').length,
    updatedSchemes: discovered.filter((d) => d.status === 'updated' || d.status === 'renamed').length,
    retiredSchemes: retired.length,
    rejectedPages: perAuthority.reduce((s, a) => s + a.rejected.length, 0),
    perAuthority,
  };

  // Persist current discovery (retired entries kept for the report, not re-saved).
  persist(discovered);

  return { discovered, retired, stats };
}

export { DISCOVERED_PATH };
