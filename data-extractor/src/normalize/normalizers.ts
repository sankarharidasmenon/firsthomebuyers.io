/**
 * Deterministic normalisers. These reshape *found* text — they never invent data.
 */

const MONTHS: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/** Collapse whitespace. */
export function cleanWhitespace(s: string): string {
  return s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Remove exactly-duplicate sentences while preserving order. */
export function dedupeSentences(text: string): string {
  if (!text) return '';
  const parts = text.split(/(?<=[.!?])\s+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p.trim());
  }
  return out.join(' ');
}

/** Normalise a currency string to "$X,XXX" form. Returns "" if not a value. */
export function normalizeCurrency(raw: string): string {
  const m = raw.replace(/,/g, '').match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!m) return '';
  const n = parseFloat(m[1]);
  if (isNaN(n)) return '';
  return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 });
}

/** Normalise a date to ISO YYYY-MM-DD when possible, else return cleaned original. */
export function normalizeDate(raw: string): string {
  const s = raw.trim();
  // 1 July 2024 | 1 Jul 2024 | 01 July 2024
  let m = s.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${m[1].padStart(2, '0')}`;
  }
  // July 1, 2024
  m = s.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${m[2].padStart(2, '0')}`;
  }
  // 01/07/2024 | 1-7-2024 (AU day-first)
  m = s.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (m) {
    const yr = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  // ISO already
  m = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return '';
}

/** Normalise a URL: force https, drop hash, strip default ports & trailing slash. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    if (u.protocol === 'http:') u.protocol = 'https:';
    u.hash = '';
    if ((u.port === '80' || u.port === '443')) u.port = '';
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return raw.trim();
  }
}

/** Canonical state value per spec. */
export function normalizeState(level: string, jurisdiction: string): string {
  const j = jurisdiction.toLowerCase();
  if (level.toLowerCase() === 'federal' || j === 'australia' || j === 'federal') return 'Australia';
  if (j.includes('nsw') || j.includes('new south wales')) return 'NSW';
  if (j.includes('vic') || j.includes('victoria')) return 'Victoria';
  return jurisdiction;
}
