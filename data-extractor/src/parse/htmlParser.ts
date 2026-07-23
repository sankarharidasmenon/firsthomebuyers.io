/**
 * Deterministic HTML parsing with cheerio.
 * Extracts: page title, visible text (main content preferred), all links,
 * PDF links, and JSON-LD blocks. No inference — pure DOM/text extraction.
 */

import * as cheerio from 'cheerio';

export interface ParsedHtml {
  title: string;
  text: string;
  links: string[];
  pdfLinks: string[];
  jsonLd: any[];
}

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'nav',
  'header',
  'footer',
  'form',
  'svg',
  '.cookie',
  '.breadcrumb',
  '[role="navigation"]',
  '[aria-hidden="true"]',
];

export function parseHtml(html: string, baseUrl: string): ParsedHtml {
  const $ = cheerio.load(html);

  const title = ($('title').first().text() || $('h1').first().text() || '').trim();

  // JSON-LD structured data
  const jsonLd: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) jsonLd.push(...parsed);
      else jsonLd.push(parsed);
    } catch {
      /* malformed JSON-LD — skip */
    }
  });

  // Collect links BEFORE stripping noise (so we keep apply/eligibility nav links)
  const links = new Set<string>();
  const pdfLinks = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const abs = toAbsolute(href, baseUrl);
    if (!abs) return;
    if (/\.pdf($|\?)/i.test(abs)) pdfLinks.add(stripHash(abs));
    else links.add(stripHash(abs));
  });

  // Visible text: prefer main content region
  const $body = cheerio.load(html);
  NOISE_SELECTORS.forEach((sel) => $body(sel).remove());
  const main =
    $body('main').first().text() ||
    $body('[role="main"]').first().text() ||
    $body('article').first().text() ||
    $body('#content').first().text() ||
    $body('body').text();
  const text = collapse(main);

  return {
    title,
    text,
    links: [...links],
    pdfLinks: [...pdfLinks],
    jsonLd,
  };
}

/** Structured extraction of tables → returns list of {headers, rows}. */
export function extractTables(html: string): { headers: string[]; rows: string[][] }[] {
  const $ = cheerio.load(html);
  const out: { headers: string[]; rows: string[][] }[] = [];
  $('table').each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find('thead th, tr:first-child th')
      .each((_, th) => {
        headers.push(collapse($(th).text()));
      });
    const rows: string[][] = [];
    $(table)
      .find('tbody tr, tr')
      .each((_, tr) => {
        const cells: string[] = [];
        $(tr)
          .find('td')
          .each((_, td) => {
            cells.push(collapse($(td).text()));
          });
        if (cells.length) rows.push(cells);
      });
    if (headers.length || rows.length) out.push({ headers, rows });
  });
  return out;
}

function toAbsolute(href: string | undefined, base: string): string | null {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('javascript:'))
    return null;
  try {
    return new URL(h, base).toString();
  } catch {
    return null;
  }
}

function stripHash(u: string): string {
  const i = u.indexOf('#');
  return i === -1 ? u : u.slice(0, i);
}

function collapse(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
