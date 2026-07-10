/**
 * Generic text/parsing helpers shared across extractors.
 *
 * Guiding rule (from the spec): never invent data. Every helper here returns an
 * empty string / empty array when it cannot confidently find a value.
 */

/** Collapse runs of whitespace into single spaces and trim. */
export function normalizeWhitespace(s: string): string {
  return s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

/** Truncate long free text for the "short" description column. */
export function truncate(s: string, max = 300): string {
  const t = normalizeWhitespace(s);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

// UI / navigation / boilerplate fragments that leak in from government pages.
const NAV_NOISE = [
  'show more', 'show less', 'open all', 'close all', 'read more', 'read less',
  'back to top', 'skip to main content', 'skip to content', 'print this page',
  'listen', 'share this', 'was this page helpful', 'on this page', 'in this section',
  'breadcrumb', 'main navigation', 'toggle navigation', 'search this site',
  'last updated', 'sign in', 'log in', 'subscribe',
];

/**
 * Clean free text for Excel cells: strip HTML tags and known nav/UI boilerplate,
 * remove PDF markers/page-number artefacts, and collapse whitespace. Does NOT
 * summarise — use conciseSummary/firstClause for that.
 */
export function cleanText(s: string): string {
  let t = (s || '')
    .replace(/<[^>]*>/g, ' ') // strip any HTML tags
    .replace(/\[PDF[^\]]*\]/gi, ' ') // strip our PDF source markers
    .replace(/\bPage \d+ of \d+\b/gi, ' ') // PDF page numbers
    .replace(/\b\d{6,}\b/g, ' '); // stray long doc/reference numbers
  const lower = t.toLowerCase();
  for (const n of NAV_NOISE) {
    if (lower.includes(n)) t = t.replace(new RegExp(escapeRegExp(n), 'gi'), ' ');
  }
  return normalizeWhitespace(t);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split cleaned text into sentences (rough). */
export function splitSentences(text: string): string[] {
  return cleanText(text)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9$])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build a short, clean summary: the first `maxSentences` meaningful sentences,
 * de-duplicated, capped at `maxLen`. Used for description-style columns so they
 * never become paragraph dumps.
 */
export function conciseSummary(text: string, maxSentences = 2, maxLen = 300): string {
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const s of splitSentences(text)) {
    if (s.length < 25) continue; // skip fragments/labels
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(s);
    if (picked.length >= maxSentences) break;
  }
  return truncate(picked.join(' '), maxLen);
}

/** The first clean clause/sentence mentioning any keyword, capped short. */
export function firstClause(text: string, keywords: string[], maxLen = 160): string {
  for (const s of splitSentences(text)) {
    const ls = s.toLowerCase();
    if (keywords.some((k) => ls.includes(k.toLowerCase()))) return truncate(s, maxLen);
  }
  return '';
}

/** Deduplicate while preserving order and dropping empties. */
export function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = normalizeWhitespace(raw);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Join a list into a single Excel cell using "; " separators. */
export function joinCell(items: string[]): string {
  return uniq(items).join('; ');
}

// Thousands may be separated by comma, space or non-breaking space — some
// government sites format amounts as "$750 000".
// The trailing `\b` after the suffix is critical: without it, the short forms
// "m"/"k" would match the FIRST LETTER of the following word (e.g. "$800,000
// meets" → "m" → ×1,000,000). The boundary forces the suffix to be a standalone
// token. `million`/`thousand` must also be whole words.
const CURRENCY_RE = /\$\s?([0-9]{1,3}(?:[,  ][0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)(?:\s?(million|thousand|k|m)\b)?/gi;

// No Australian first-home-buyer benefit or property cap exceeds this. Values
// above it are almost always a parsing artefact and are discarded.
const MAX_SANE_DOLLARS = 20_000_000;

export interface MoneyMatch {
  raw: string;
  value: number;
}

/** Extract dollar amounts from free text, normalising k/million suffixes. */
export function extractMoney(text: string): MoneyMatch[] {
  const out: MoneyMatch[] = [];
  let m: RegExpExecArray | null;
  CURRENCY_RE.lastIndex = 0;
  while ((m = CURRENCY_RE.exec(text)) !== null) {
    let value = parseFloat(m[1].replace(/[,  ]/g, ''));
    const suffix = (m[2] || '').trim().toLowerCase();
    if (suffix === 'million' || suffix === 'm') value *= 1_000_000;
    else if (suffix === 'k' || suffix === 'thousand') value *= 1_000;
    if (!Number.isNaN(value) && value > 0 && value <= MAX_SANE_DOLLARS) {
      out.push({ raw: m[0].trim(), value });
    }
  }
  return out;
}

/** Extract percentage values (e.g. "5%", "2.5 per cent"). */
export function extractPercentages(text: string): string[] {
  const out: string[] = [];
  const re = /([0-9]+(?:\.[0-9]+)?)\s?(?:%|per\s?cent)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(`${m[1]}%`);
  return uniq(out);
}

/**
 * Extract dates in common Australian formats plus financial-year references.
 * Returns raw matched strings; downstream code decides which is start/end.
 */
export function extractDates(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b(?:20)\d{2}[-–]\d{2}\b/g, // 2024-25
    /\b(?:FY)\s?\d{2,4}\b/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) out.push(m[0]);
  }
  return uniq(out);
}

/** Extract Australian financial-year strings like "2024-25" or "2024–2025". */
export function extractFinancialYear(text: string): string {
  const m = text.match(/\b20\d{2}\s?[-–/]\s?(?:20)?\d{2}\b/);
  return m ? normalizeWhitespace(m[0]).replace(/\s/g, '') : '';
}

/** Sentences (rough split) that contain any of the given keywords. */
export function sentencesWith(text: string, keywords: string[]): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9$])/);
  const lowerKw = keywords.map((k) => k.toLowerCase());
  return sentences.filter((s) => {
    const ls = s.toLowerCase();
    return lowerKw.some((k) => ls.includes(k));
  });
}

/** True if any keyword appears in the text (case-insensitive). */
export function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/** Format a JS number as an Australian currency string. */
export function formatMoney(value: number): string {
  return '$' + value.toLocaleString('en-AU');
}

/** Async sleep. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Canonicalise a URL for de-duplication and visited-tracking:
 *  - lowercase host, drop fragment, drop tracking query params
 *  - strip a trailing slash (except root), drop default ports
 * Returns the input unchanged if it cannot be parsed.
 */
export function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();
    // Remove common tracking params; keep functional query strings otherwise.
    const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    for (const p of drop) u.searchParams.delete(p);
    let out = u.toString();
    // Strip a single trailing slash on non-root paths.
    out = out.replace(/(\/[^/?#]+)\/(\?|$)/, '$1$2');
    return out;
  } catch {
    return input;
  }
}

/**
 * Strip a trailing site-name segment from a page <title>, e.g.
 * "First Home Owner Grant | Revenue NSW" → "First Home Owner Grant".
 * Only strips when the tail looks like an organisation name.
 */
export function cleanPageTitle(title: string): string {
  const orgHint = /(revenue|office|government|treasury|\bato\b|australia|department|nsw|vic|qld|\bwa\b|\bsa\b|tas|\bact\b|\bnt\b)/i;
  const parts = title.split(/\s+[|–—-]\s+/);
  if (parts.length > 1 && orgHint.test(parts[parts.length - 1])) {
    return normalizeWhitespace(parts.slice(0, -1).join(' - '));
  }
  return normalizeWhitespace(title);
}

/** A URL's pathname, or '' if unparseable. */
export function urlPath(input: string): string {
  try {
    return new URL(input).pathname;
  } catch {
    return '';
  }
}
