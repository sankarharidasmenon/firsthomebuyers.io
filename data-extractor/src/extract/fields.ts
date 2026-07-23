/**
 * Field-level deterministic extractors.
 * Every function returns "" when no explicit evidence is found — never a guess.
 * Boolean-style fields return 'Yes' / 'No' only when the text states it; else "".
 */

import * as cheerio from 'cheerio';
import { normalizeCurrency, normalizeDate } from '../normalize/normalizers';

/* ───────────────────────── contact details ───────────────────────── */

export function extractEmail(text: string): string {
  const m = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:gov\.au|nsw\.gov\.au|vic\.gov\.au|com\.au|org\.au|au)\b/);
  return m ? m[0] : '';
}

export function extractPhone(text: string): string {
  // AU formats: 13 xx xx, 1300/1800 xxx xxx, (0x) xxxx xxxx, +61 x xxxx xxxx
  const patterns = [
    /\b(?:1300|1800)\s?\d{3}\s?\d{3}\b/,
    /\b13\s?\d{2}\s?\d{2}\b/,
    /\b\(0[2-8]\)\s?\d{4}\s?\d{4}\b/,
    /\b\+61\s?[2-8]\s?\d{4}\s?\d{4}\b/,
    /\b0[2-8]\s?\d{4}\s?\d{4}\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].replace(/\s+/g, ' ').trim();
  }
  return '';
}

/* ───────────────────────── amounts / caps ───────────────────────── */

/**
 * Grant/benefit amount tightly bound to grant/payment/withdraw wording.
 * Capped at $100,000 so property-price caps ($600k–$800k) are never mistaken
 * for a grant amount.
 */
export function extractMaxAmount(text: string): string {
  const cands: number[] = [];
  // Patterns are tightly bound to grant/payment/withdrawal wording so unrelated
  // figures (penalties, price caps, "up to $X" penalties) are never captured.
  const patterns = [
    /\$\s?([\d,]+)\s+(?:first home owner )?grant\b/gi,
    /grant of\s+(?:up to\s+)?\$\s?([\d,]+)/gi,
    /(?:payment|benefit) of\s+\$\s?([\d,]+)/gi,
    /(?:withdraw|release|access|save)\s+up to\s+\$\s?([\d,]+)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n >= 1000 && n <= 100000) cands.push(n);
    }
  }
  if (!cands.length) return '';
  return normalizeCurrency('$' + Math.max(...cands));
}

export function extractPropertyPriceCap(text: string): string {
  const cands: number[] = [];
  const patterns = [
    /(?:property\s+price\s+cap|price\s+cap|purchase\s+price\s+(?:cap|limit|threshold)|value\s+(?:cap|limit|threshold)|dwelling\s+price)\D{0,40}?\$\s?([\d,]+)/gi,
    /(?:homes?|properties|property|home|dwelling)\D{0,30}?(?:valued|value|worth|priced)?\D{0,20}?up to\s+\$\s?([\d,]+)/gi,
    /(?:valued|value|priced)\D{0,20}?(?:at|of|up to)?\D{0,10}?\$\s?([\d,]+)\s*(?:or less|or under)/gi,
    /new homes?\D{0,20}?(?:up to|under|below)\s+\$\s?([\d,]+)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n >= 300000 && n <= 5000000) cands.push(n);
    }
  }
  if (!cands.length) return '';
  return normalizeCurrency('$' + Math.max(...cands));
}

/** Income caps split into single and couple/joint where the page distinguishes them. */
export function extractIncomeCaps(text: string): { single: string; couple: string } {
  // "single" must not match "single parent" (that belongs to the couple/joint cap).
  const single = grabIncome(text, /(?:single(?!\s*parents?)|individual)(?:\s+applicants?)?/i);
  const couple = grabIncome(text, /(?:joint|couple|two applicants|single parents?|families)/i);
  return { single, couple };
}

function grabIncome(text: string, label: RegExp): string {
  // Amounts can sit on EITHER side of the label
  // ("$103,000 for individual applicants" vs "individual: $103,000"),
  // so locate each label occurrence and take the NEAREST dollar figure.
  const labelRe = new RegExp(label.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(text))) {
    const idx = m.index;
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + m[0].length + 40);
    const seg = text.slice(start, end);
    const amtRe = /\$\s?([\d,]{5,})/g;
    let a: RegExpExecArray | null;
    let best: number | null = null;
    let bestDist = Infinity;
    while ((a = amtRe.exec(seg))) {
      const pos = start + a.index;
      const dist = Math.abs(pos - idx);
      const n = parseFloat(a[1].replace(/,/g, ''));
      if (!isNaN(n) && n >= 30000 && n <= 500000 && dist < bestDist) {
        bestDist = dist;
        best = n;
      }
    }
    if (best !== null) return normalizeCurrency('$' + best);
  }
  return '';
}

/** Threshold below which a full stamp-duty exemption applies. */
export function extractFullExemptionThreshold(text: string): string {
  const patterns = [
    /full (?:duty )?exemption\D{0,40}?\$\s?([\d,]+)/i,
    /(?:no|nil|zero) (?:stamp |transfer )?duty\D{0,30}?(?:up to|below|under)\s+\$\s?([\d,]+)/i,
    /exemption for (?:homes|properties)\D{0,20}?(?:up to|below|under)\s+\$\s?([\d,]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n >= 100000 && n <= 5000000) return normalizeCurrency('$' + n);
    }
  }
  return '';
}

/** The value band over which a partial/sliding concession applies. */
export function extractPartialConcessionRange(text: string): string {
  const patterns = [
    /(?:concession|reduced (?:rate of )?duty|sliding scale)\D{0,40}?\$\s?([\d,]+)\s*(?:to|and|[-–—])\s*\$\s?([\d,]+)/i,
    /between\s+\$\s?([\d,]+)\s+and\s+\$\s?([\d,]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const a = parseFloat(m[1].replace(/,/g, ''));
      const b = parseFloat(m[2].replace(/,/g, ''));
      // FHB concession bands sit at the top of the market — require the lower
      // bound to be a realistic property value so generic duty-rate rows
      // (e.g. "$130,000 to $440,000") are not mistaken for the concession range.
      if (a >= 400000 && b > a && b <= 5000000) {
        return `${normalizeCurrency('$' + a)} – ${normalizeCurrency('$' + b)}`;
      }
    }
  }
  return '';
}

/**
 * Minimum deposit percentage for low-deposit schemes, e.g. "5%".
 * Capped at 15% so the 20% LMI threshold ("if your deposit is below 20%…") is
 * never mistaken for a scheme's minimum deposit.
 */
export function extractMinimumDeposit(text: string): string {
  const m = text.match(
    /(?:as little as|minimum(?: of)?|deposit of (?:just|only)?|with a?)\s*(\d{1,2})%\s*deposit|(\d{1,2})%\s+deposit\b/i
  );
  const pct = m ? m[1] || m[2] : '';
  if (!pct) return '';
  const n = parseInt(pct, 10);
  return n >= 1 && n <= 15 ? `${n}%` : '';
}

/** Government equity share, e.g. "up to 40%". */
export function extractEquityShare(text: string): string {
  const m = text.match(/up to\s+(\d{1,2})%[^.]{0,40}?(?:equity|contribut|purchase price|of (?:the )?(?:property|home|value))/i);
  return m ? `Up to ${m[1]}%` : '';
}

export function extractIncomeLimit(text: string): string {
  const cands: number[] = [];
  const re =
    /(?:income\s+(?:cap|limit|threshold|test)|taxable\s+income|combined\s+income|earn(?:ing)?s?\s+(?:less|under|below|no more))\D{0,40}?\$\s?([\d,]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n) && n >= 10000) cands.push(n);
  }
  if (!cands.length) return '';
  return normalizeCurrency('$' + Math.max(...cands));
}

/* ───────────────────────── dates ───────────────────────── */

export function extractLastUpdated(html: string, text: string): string {
  const $ = cheerio.load(html);
  const metas = [
    $('meta[property="article:modified_time"]').attr('content'),
    $('meta[name="last-modified"]').attr('content'),
    $('meta[name="dcterms.modified"]').attr('content'),
    $('time[datetime]').first().attr('datetime'),
  ];
  for (const v of metas) {
    if (v) {
      const d = normalizeDate(v);
      if (d) return d;
    }
  }
  const m = text.match(/(?:last\s+updated|page\s+updated|reviewed)[:\s]+([^\n.]{4,40})/i);
  if (m) {
    const d = normalizeDate(m[1]);
    if (d) return d;
  }
  return '';
}

export function extractDateNear(text: string, labelRe: RegExp): string {
  const m = text.match(labelRe);
  if (m) {
    const d = normalizeDate(m[1]);
    if (d) return d;
  }
  return '';
}

/* ───────────────────────── boolean flags (evidence-based) ───────────────────────── */

/** Returns 'Yes' if a positive pattern matches, 'No' if a negative one does, else ''. */
export function flag(text: string, positive: RegExp[], negative: RegExp[] = []): string {
  for (const re of negative) if (re.test(text)) return 'No';
  for (const re of positive) if (re.test(text)) return 'Yes';
  return '';
}

/** 'Yes' if any pattern matches, else '' (no negative case). */
export function present(text: string, positive: RegExp[]): string {
  return positive.some((re) => re.test(text)) ? 'Yes' : '';
}

/* ───────────────────────── section extraction ───────────────────────── */

export interface Sections {
  overview: string;
  eligibility: string;
  benefits: string;
  faqs: string;
}

/**
 * Walk the DOM headings and gather the text under each until the next heading.
 * Buckets are matched to overview / eligibility / benefits / faqs by heading text.
 */
export function extractSections(html: string): Sections {
  const $ = cheerio.load(html);
  $('script,style,nav,header,footer,form,aside').remove();

  const buckets: Sections = { overview: '', eligibility: '', benefits: '', faqs: '' };
  const headings = $('h1, h2, h3').toArray();

  for (const h of headings) {
    const htext = clean($(h).text()).toLowerCase();
    let key: keyof Sections | null = null;
    if (/eligib|who can|qualify|criteria|requirement/.test(htext)) key = 'eligibility';
    else if (/benefit|how much|amount|what you (?:get|receive)|value|assistance/.test(htext)) key = 'benefits';
    else if (/faq|frequently asked|questions/.test(htext)) key = 'faqs';
    else if (/overview|about|what is|introduction/.test(htext)) key = 'overview';
    if (!key) continue;

    // collect following siblings until the next heading
    let content = '';
    let el = $(h).next();
    let guard = 0;
    while (el.length && !/^h[1-3]$/i.test(el.get(0)?.tagName || '') && guard < 30) {
      const t = clean(el.text());
      if (t) content += t + ' ';
      el = el.next();
      guard++;
    }
    content = clean(content);
    if (content && content.length > buckets[key].length) buckets[key] = content;
  }

  // Overview fallback: first substantial paragraph
  if (!buckets.overview) {
    const firstP = $('main p, article p, #content p, p')
      .toArray()
      .map((p) => clean($(p).text()))
      .find((t) => t.length > 80);
    if (firstP) buckets.overview = firstP;
  }
  return buckets;
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
