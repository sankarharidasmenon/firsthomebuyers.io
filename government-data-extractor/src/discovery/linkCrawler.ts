/**
 * Breadth-first internal link crawler for a single authority.
 *
 * Guarantees:
 *  - Stays on the authority's own host(s) and only *.gov.au (allowlist).
 *  - Honours robots.txt and an optional path-prefix allowlist.
 *  - Bounded by maxDepth (spec: 4) and maxPages so it never crawls infinitely.
 *  - Throttled: limited concurrency + a delay between requests (be polite).
 *  - Skips non-content links (social, news, media, sitemap, assets, …).
 */
import pLimit from 'p-limit';
import type { Authority, CrawledPage } from '../types';
import { authorityHosts } from '../config/authorities';
import { isOfficialHost } from '../config/sources';
import { getPage } from '../services/pageDownloader';
import { parseHtml } from '../parsers/htmlParser';
import { RobotsChecker } from './robotsTxt';
import { contentHash } from '../utils/hash';
import { logger } from '../utils/logger';
import { cleanPageTitle, normalizeUrl, sleep, urlPath } from '../utils/helpers';

export interface CrawlOptions {
  maxDepth: number;
  maxPages: number;
  concurrency: number;
  delayMs: number;
  respectRobots: boolean;
}

export const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  maxDepth: 4,
  maxPages: 80,
  concurrency: 2,
  delayMs: 400,
  respectRobots: true,
};

// Link path/host fragments that are never scheme content.
const IGNORE_SUBSTRINGS = [
  'facebook.', 'linkedin.', 'youtube.', 'twitter.', 'x.com', 'instagram.', 'tiktok.',
  '/news', '/media', '/newsroom', '/press', '/blog', '/events', '/event/',
  '/privacy', '/careers', '/career', '/contact', '/sitemap', '/search',
  '/login', '/subscribe', '/rss', '/feedback', '/complaints', '/accessibility',
  '/copyright', '/disclaimer', '/whats-new', '/media-release', '/ministers',
  '/minister', '/speech', '/speeches', '/budget', '/annual-report',
];

// File extensions to skip (assets & documents — PDFs handled by extractor, not crawler).
const IGNORE_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.zip', '.doc',
  '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.mp4', '.mp3', '.csv', '.json',
];

function isIgnorableLink(href: string): boolean {
  const lower = href.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:') || lower.startsWith('javascript:')) return true;
  if (IGNORE_EXTENSIONS.some((ext) => urlPath(lower).endsWith(ext))) return true;
  if (IGNORE_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  return false;
}

function withinPrefixes(pathname: string, prefixes?: string[]): boolean {
  if (!prefixes || prefixes.length === 0) return true;
  return prefixes.some((p) => pathname.startsWith(p));
}

export interface CrawlResult {
  pages: CrawledPage[];
  /** Total internal links encountered across all crawled pages (for reporting). */
  linksSeen: number;
}

/** Crawl one authority and return the pages visited (deduplicated by URL). */
export async function crawlAuthority(
  authority: Authority,
  options: Partial<CrawlOptions> = {}
): Promise<CrawlResult> {
  const opts = { ...DEFAULT_CRAWL_OPTIONS, ...options };
  const hosts = authorityHosts(authority);
  const limit = pLimit(opts.concurrency);

  // Robots checkers cached per host.
  const robotsCache = new Map<string, RobotsChecker>();
  async function robotsFor(origin: string): Promise<RobotsChecker | null> {
    if (!opts.respectRobots) return null;
    if (!robotsCache.has(origin)) {
      robotsCache.set(origin, await RobotsChecker.forOrigin(origin));
    }
    return robotsCache.get(origin)!;
  }

  const visited = new Set<string>();
  const collected: CrawledPage[] = [];
  let linksSeen = 0;
  let frontier: { url: string; depth: number }[] = authority.landingUrls.map((u) => ({
    url: normalizeUrl(u),
    depth: 0,
  }));
  for (const f of frontier) visited.add(f.url);

  const linkAllowed = (href: string): boolean => {
    let host: string;
    let pathname: string;
    try {
      const u = new URL(href);
      host = u.hostname.toLowerCase();
      pathname = u.pathname;
    } catch {
      return false;
    }
    if (!isOfficialHost(host)) return false; // never leave .gov.au
    if (!hosts.has(host)) return false; // stay on this authority's host(s)
    if (isIgnorableLink(href)) return false;
    if (!withinPrefixes(pathname, authority.allowPathPrefixes)) return false;
    return true;
  };

  for (let depth = 0; depth <= opts.maxDepth && frontier.length; depth++) {
    if (collected.length >= opts.maxPages) break;
    const nextFrontier = new Map<string, { url: string; depth: number }>();

    await Promise.all(
      frontier.map((node) =>
        limit(async () => {
          if (collected.length >= opts.maxPages) return;

          // Robots + throttle.
          let origin: string;
          let pathname: string;
          try {
            const u = new URL(node.url);
            origin = u.origin;
            pathname = u.pathname;
          } catch {
            return;
          }
          const robots = await robotsFor(origin);
          if (robots && !robots.isAllowed(pathname)) {
            logger.debug(`robots.txt disallows ${node.url}`);
            return;
          }
          await sleep(opts.delayMs);

          let html: string;
          let lastModified: string | undefined;
          let etag: string | undefined;
          try {
            const res = await getPage(node.url);
            html = res.html;
            lastModified = res.lastModified;
            etag = res.etag;
          } catch (err) {
            logger.debug(`Crawl skip (fetch failed) ${node.url}: ${(err as Error).message}`);
            return;
          }

          const parsed = parseHtml(html, node.url);

          // Capture same-host PDF links to attach to the scheme later.
          const pageHost = (() => { try { return new URL(node.url).hostname.toLowerCase(); } catch { return ''; } })();
          const pdfLinks = Array.from(
            new Set(
              parsed.links
                .map((l) => l.href)
                .filter((href) => urlPath(href).toLowerCase().endsWith('.pdf'))
                .filter((href) => { try { return new URL(href).hostname.toLowerCase() === pageHost; } catch { return false; } })
            )
          );

          collected.push({
            url: node.url,
            title: cleanPageTitle(parsed.title),
            h1: parsed.headings[0] || '',
            metaDescription: parsed.metaDescription,
            contentHash: contentHash(parsed.text),
            lastModified,
            etag,
            depth: node.depth,
            authorityId: authority.id,
            pdfLinks,
          });
          linksSeen += parsed.links.length;
          logger.debug(`Crawled [d${node.depth}] ${node.url} (${parsed.links.length} links)`);

          // Enqueue internal links for the next depth.
          if (node.depth < opts.maxDepth) {
            for (const { href } of parsed.links) {
              const norm = normalizeUrl(href);
              if (visited.has(norm) || nextFrontier.has(norm)) continue;
              if (!linkAllowed(norm)) continue;
              nextFrontier.set(norm, { url: norm, depth: node.depth + 1 });
            }
          }
        })
      )
    );

    for (const url of nextFrontier.keys()) visited.add(url);
    frontier = [...nextFrontier.values()];
  }

  logger.ok(
    `Crawled authority ${authority.name}: ${collected.length} page(s), ${linksSeen} link(s) (depth≤${opts.maxDepth}, cap ${opts.maxPages})`
  );
  return { pages: collected, linksSeen };
}
