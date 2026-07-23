/**
 * Parse an official "property price caps" page into per-state caps.
 * Deterministic: scans for each state's name and captures the dollar figures that
 * follow it (capital-city/regional-centre cap and rest-of-state cap).
 *
 * Focus jurisdictions (NSW, VIC) are always surfaced first; other states are
 * included for completeness when present.
 */

import { extractTables } from '../parse/htmlParser';

interface StateCap {
  code: string;
  capital: string; // capital city / regional centres cap
  rest: string; // rest of state cap
}

const STATE_NAMES: { code: string; re: RegExp }[] = [
  { code: 'NSW', re: /New South Wales/i },
  { code: 'VIC', re: /Victoria/i },
  { code: 'QLD', re: /Queensland/i },
  { code: 'WA', re: /Western Australia/i },
  { code: 'SA', re: /South Australia/i },
  { code: 'TAS', re: /Tasmania/i },
  { code: 'ACT', re: /Australian Capital Territory|\bACT\b/i },
  { code: 'NT', re: /Northern Territory|\bNT\b/i },
];

function money(n: string): string {
  const v = parseFloat(n.replace(/,/g, ''));
  if (isNaN(v)) return '';
  return '$' + v.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

/** Extract up to two dollar figures appearing in a text window after a state name. */
function capsFromText(text: string): StateCap[] {
  const out: StateCap[] = [];
  for (let i = 0; i < STATE_NAMES.length; i++) {
    const { code, re } = STATE_NAMES[i];
    const m = re.exec(text);
    if (!m) continue;
    // window from this state's name to the next state's name (or +240 chars)
    const start = m.index;
    let end = text.length;
    for (let j = 0; j < STATE_NAMES.length; j++) {
      if (j === i) continue;
      const nm = STATE_NAMES[j].re.exec(text.slice(start + m[0].length));
      if (nm) end = Math.min(end, start + m[0].length + nm.index);
    }
    const window = text.slice(start, Math.min(end, start + 240));
    const amts = [...window.matchAll(/\$\s?([\d,]{4,})/g)].map((a) => a[1]);
    if (amts.length) {
      out.push({ code, capital: money(amts[0]), rest: amts[1] ? money(amts[1]) : '' });
    }
  }
  return out;
}

/** Prefer table-structured caps if the page has a clean caps table. */
function capsFromTables(html: string): StateCap[] {
  const tables = extractTables(html);
  const out: StateCap[] = [];
  for (const t of tables) {
    for (const row of t.rows) {
      const joined = row.join(' ');
      const st = STATE_NAMES.find((s) => s.re.test(joined));
      if (!st) continue;
      const amts = [...joined.matchAll(/\$\s?([\d,]{4,})/g)].map((a) => a[1]);
      if (amts.length && !out.some((o) => o.code === st.code)) {
        out.push({ code: st.code, capital: money(amts[0]), rest: amts[1] ? money(amts[1]) : '' });
      }
    }
  }
  return out;
}

export interface CapsResult {
  /** all states, formatted for the "Price Cap Variations" column */
  allVariations: string;
  /** NSW + VIC focus string for "State-by-State Value Variations" / "Property Price Cap" */
  focus: string;
  nsw: string;
  vic: string;
}

export function parseStateCaps(html: string, text: string): CapsResult | null {
  let caps = capsFromTables(html);
  if (caps.length < 2) caps = capsFromText(text);
  if (!caps.length) return null;

  const fmt = (c: StateCap) =>
    c.rest
      ? `${c.code}: ${c.capital} (capital city/regional), ${c.rest} (rest of state)`
      : `${c.code}: ${c.capital}`;

  const byCode = (code: string) => caps.find((c) => c.code === code);
  const nswCap = byCode('NSW');
  const vicCap = byCode('VIC');

  const allVariations = caps.map(fmt).join('; ');
  const focusParts: string[] = [];
  if (nswCap) focusParts.push(fmt(nswCap));
  if (vicCap) focusParts.push(fmt(vicCap));

  return {
    allVariations,
    focus: focusParts.join('; '),
    nsw: nswCap ? fmt(nswCap) : '',
    vic: vicCap ? fmt(vicCap) : '',
  };
}
