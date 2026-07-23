/**
 * Unified page fetch:
 *   1. Enforce allowed-domain policy (hard guarantee: official gov only).
 *   2. Respect robots.txt (+ crawl delay).
 *   3. Try plain HTTP; if blocked (403/406/451) or content looks empty/JS-gated,
 *      fall back to a real Chromium render via Playwright.
 *   4. Parse into a FetchedPage.
 */

import { httpGet } from './httpClient';
import { renderPage } from './browser';
import { isAllowed } from './robots';
import { isAllowedDomain, isBlockedHost } from '../discovery/domainFilter';
import { parseHtml } from '../parse/htmlParser';
import { log } from './logger';
import type { FetchedPage } from '../types';

const visited = new Map<string, FetchedPage | null>();

export function alreadyFetched(url: string): boolean {
  return visited.has(normalize(url));
}

export async function fetchPage(url: string): Promise<FetchedPage | null> {
  const key = normalize(url);
  if (visited.has(key)) return visited.get(key)!;

  if (!isAllowedDomain(url) || isBlockedHost(url)) {
    log.skip(url, 'not an allowed government domain');
    visited.set(key, null);
    return null;
  }

  const robots = await isAllowed(url);
  if (!robots.allowed) {
    log.skip(url, 'disallowed by robots.txt');
    visited.set(key, null);
    return null;
  }
  const delayMs = Math.max(1200, robots.crawlDelayMs);

  let html = '';
  let status = 0;
  let finalUrl = url;
  let rendered = false;

  // Attempt 1: plain HTTP
  try {
    const res = await httpGet(url, { delayMs });
    status = res.status;
    finalUrl = res.finalUrl;
    if (typeof res.data === 'string') html = res.data;
    const ct = res.contentType.toLowerCase();
    const looksHtml = ct.includes('html') || /<html|<!doctype/i.test(html.slice(0, 500));
    if (status === 200 && looksHtml && html.length > 800) {
      // good
    } else if ([401, 403, 406, 451].includes(status) || html.length <= 800) {
      // Attempt 2: browser render
      const r = await renderPage(url);
      if (r && r.html) {
        html = r.html;
        status = r.status || status;
        finalUrl = r.finalUrl;
        rendered = true;
      }
    }
  } catch (err) {
    // HTTP failed entirely → try browser
    const r = await renderPage(url);
    if (r && r.html) {
      html = r.html;
      status = r.status;
      finalUrl = r.finalUrl;
      rendered = true;
    } else {
      log.broken(url, `fetch failed: ${(err as Error).message}`);
      visited.set(key, null);
      return null;
    }
  }

  if (!html || html.length < 200) {
    log.broken(url, `empty response (status ${status})`);
    visited.set(key, null);
    return null;
  }
  if (status >= 400) {
    log.broken(url, `HTTP ${status}`);
    visited.set(key, null);
    return null;
  }

  const parsed = parseHtml(html, finalUrl);
  const page: FetchedPage = {
    url,
    finalUrl,
    title: parsed.title,
    statusCode: status,
    html,
    text: parsed.text,
    links: parsed.links,
    pdfLinks: parsed.pdfLinks,
    jsonLd: parsed.jsonLd,
    rendered,
    fetchedAt: new Date().toISOString(),
  };
  log.visit(url, `${status}${rendered ? ' (rendered)' : ''} · ${parsed.text.length} chars`);
  visited.set(key, page);
  return page;
}

export function normalize(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // drop trailing slash (except root) and normalise case of host
    let p = u.pathname;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    u.pathname = p;
    u.host = u.host.toLowerCase();
    return u.toString();
  } catch {
    return url;
  }
}

export function allVisited(): FetchedPage[] {
  return [...visited.values()].filter((v): v is FetchedPage => v !== null);
}
