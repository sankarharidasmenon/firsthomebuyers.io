/**
 * HTML → structured text parsing using cheerio.
 *
 * We deliberately strip navigation/footer chrome so extractors see mostly the
 * substantive page content, reducing false-positive matches.
 */
import * as cheerio from 'cheerio';
import { normalizeWhitespace } from '../utils/helpers';

export interface ParsedHtml {
  title: string;
  metaDescription: string;
  /** Full visible text of the main content area. */
  text: string;
  /** Heading strings (h1–h3) in document order. */
  headings: string[];
  /** List items — often eligibility bullet points. */
  listItems: string[];
  /** All absolute-ish links: { text, href }. */
  links: { text: string; href: string }[];
}

const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'nav',
  'header',
  'footer',
  '.cookie',
  '.breadcrumb',
  '[role="navigation"]',
  '[aria-hidden="true"]',
];

/** Prefer a main content container if the page exposes one. */
const MAIN_SELECTORS = ['main', '[role="main"]', 'article', '#content', '.content'];

export function parseHtml(html: string, baseUrl: string): ParsedHtml {
  const $ = cheerio.load(html);

  const title = normalizeWhitespace($('title').first().text());
  const metaDescription = normalizeWhitespace(
    $('meta[name="description"]').attr('content') || ''
  );

  // Collect links before we strip chrome (some PDFs live in footers).
  const links: { text: string; href: string }[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = normalizeWhitespace($(el).text());
    if (href) links.push({ text, href: resolveUrl(href, baseUrl) });
  });

  // Strip chrome for text extraction.
  for (const sel of STRIP_SELECTORS) $(sel).remove();

  // Choose the richest main container.
  let $scope: cheerio.Cheerio<any> = $('body');
  for (const sel of MAIN_SELECTORS) {
    const $found = $(sel).first();
    if ($found.length && $found.text().trim().length > 200) {
      $scope = $found;
      break;
    }
  }

  const headings: string[] = [];
  $scope.find('h1, h2, h3').each((_, el) => {
    const t = normalizeWhitespace($(el).text());
    if (t) headings.push(t);
  });

  const listItems: string[] = [];
  $scope.find('li').each((_, el) => {
    const t = normalizeWhitespace($(el).text());
    if (t && t.length < 400) listItems.push(t);
  });

  const text = normalizeWhitespace($scope.text());

  return { title, metaDescription, text, headings, listItems, links };
}

/** Resolve a possibly-relative href against the page base URL. */
export function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}
