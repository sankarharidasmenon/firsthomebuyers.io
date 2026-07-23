/**
 * Merge duplicate scheme records (same scheme discovered via multiple paths).
 * Two records are the same scheme if they share a normalised Official Scheme Name
 * OR the same Official URL. On merge, non-empty field values are preferred; the
 * longer value wins when both are populated (more complete extraction).
 */

import type { SchemeRecord } from '../types';
import { normalizeUrl } from '../normalize/normalizers';

function nameKey(r: SchemeRecord): string {
  const state = r['UI/UX Applicable States/Territories'] || '';
  const name = (r['UI/UX Scheme Name (official)'] || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  // Scope by jurisdiction so an identically-named federal/state scheme isn't merged.
  return `${state}::${name}`;
}

function urlKey(r: SchemeRecord): string {
  return normalizeUrl(r['Official Government URL'] || '').toLowerCase();
}

export function mergeRecords(records: SchemeRecord[]): SchemeRecord[] {
  const byName = new Map<string, SchemeRecord>();
  const byUrl = new Map<string, string>(); // urlKey -> nameKey owner

  for (const rec of records) {
    const nk = nameKey(rec);
    const uk = urlKey(rec);

    let targetKey: string | undefined;
    if (nk && byName.has(nk)) targetKey = nk;
    else if (uk && byUrl.has(uk)) targetKey = byUrl.get(uk);

    if (targetKey && byName.has(targetKey)) {
      byName.set(targetKey, mergeTwo(byName.get(targetKey)!, rec));
    } else {
      byName.set(nk || uk || Math.random().toString(36), rec);
      if (uk) byUrl.set(uk, nk || uk);
    }
  }
  return [...byName.values()];
}

function mergeTwo(a: SchemeRecord, b: SchemeRecord): SchemeRecord {
  const out: SchemeRecord = { ...a };
  for (const key of Object.keys(b)) {
    const av = (a[key] || '').trim();
    const bv = (b[key] || '').trim();
    if (!av && bv) out[key] = bv;
    else if (av && bv && bv.length > av.length && !isFlag(av, bv)) out[key] = bv;
  }
  return out;
}

/** Don't let "Yes"/"No" flags be overwritten by longer-but-different text. */
function isFlag(av: string, bv: string): boolean {
  const flags = new Set(['yes', 'no']);
  return flags.has(av.toLowerCase()) || flags.has(bv.toLowerCase());
}
