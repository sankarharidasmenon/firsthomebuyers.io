/**
 * Website collector: the default acquisition path when no RSS feed exists.
 *
 * Flow (per spec priority):
 *   1. HEAD request  → capture Last-Modified + ETag
 *   2. GET html      → capture content
 *   3. content hash  → SHA-256 of normalized visible text
 *   4. pdf detection → collect linked PDF URLs for the pdfCollector
 */
import type { FetchedPage, Source } from '../types';
import { getPage, headPage } from '../services/pageDownloader';
import { parseHtml } from '../parsers/htmlParser';
import { contentHash } from '../utils/hash';
import { isOfficialHost } from '../config/sources';
import { logger } from '../utils/logger';

/** Extensions we treat as downloadable PDF assets. */
function isPdfLink(href: string): boolean {
  try {
    const u = new URL(href);
    return u.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return href.toLowerCase().endsWith('.pdf');
  }
}

export async function collectWebsite(source: Source): Promise<FetchedPage> {
  const head = await headPage(source.url);
  if (head) {
    logger.debug(
      `HEAD ${source.url} → ${head.status}` +
        (head.lastModified ? ` last-modified=${head.lastModified}` : '') +
        (head.etag ? ` etag=${head.etag}` : '')
    );
  }

  const res = await getPage(source.url);
  const parsed = parseHtml(res.html, source.url);

  const pdfLinks = parsed.links
    .map((l) => l.href)
    .filter((href) => isPdfLink(href))
    .filter((href) => {
      try {
        return isOfficialHost(new URL(href).hostname);
      } catch {
        return false;
      }
    });

  logger.ok(
    `Crawled page: ${source.programName} (${source.jurisdiction}) — ${parsed.text.length} chars, ${pdfLinks.length} PDF link(s)`
  );

  return {
    url: source.url,
    status: res.status,
    html: res.html,
    contentHash: contentHash(parsed.text),
    lastModified: res.lastModified ?? head?.lastModified,
    etag: res.etag ?? head?.etag,
    fetchedAt: new Date().toISOString(),
    pdfLinks: Array.from(new Set(pdfLinks)),
  };
}
