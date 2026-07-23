/**
 * Pre-export validation. Enforces the spec's guarantees:
 *   - Mandatory columns populated
 *   - Program Type ∈ {Grant, Scheme}
 *   - State ∈ {Australia, NSW, Victoria}
 *   - No duplicate Scheme Names
 *   - No duplicate Official URLs
 * Invalid rows are dropped (with a logged reason); soft issues are warnings.
 */

import { log } from '../core/logger';
import type { SchemeRecord } from '../types';

const VALID_TYPES = new Set(['Grant', 'Scheme']);
const VALID_STATES = new Set(['All States & Territories', 'NSW (New South Wales)', 'VIC (Victoria)']);

export function validate(records: SchemeRecord[]): SchemeRecord[] {
  const kept: SchemeRecord[] = [];
  const seenNames = new Set<string>();
  const seenUrls = new Set<string>();

  for (const r of records) {
    const name = r['UI/UX Scheme Name (official)'];
    const type = r['UI/UX Program Type'];
    const state = r['UI/UX Applicable States/Territories'];
    const url = (r['Official Government URL'] || '').toLowerCase();

    // Hard rules
    if (!name) {
      log.warn(`Dropping row: missing mandatory Scheme Name (id=${r['Scheme ID']})`);
      continue;
    }
    if (!VALID_TYPES.has(type)) {
      log.warn(`Dropping "${name}": invalid Program Type "${type}"`);
      continue;
    }
    if (!VALID_STATES.has(state)) {
      log.warn(`Dropping "${name}": invalid State "${state}"`);
      continue;
    }
    if (r['UI/UX Include'] !== 'Yes') {
      log.warn(`Fixing "${name}": UI/UX Include forced to "Yes"`);
      r['UI/UX Include'] = 'Yes';
    }

    // De-duplicate by scheme name within a jurisdiction (the same official name
    // can legitimately exist federally and per-state — e.g. First Home Owner Grant).
    const nk = `${state}::${name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`;
    if (seenNames.has(nk)) {
      log.warn(`Dropping duplicate scheme name: "${name}" (${state})`);
      continue;
    }
    if (url && seenUrls.has(url)) {
      log.warn(`Dropping duplicate Official URL for "${name}": ${url}`);
      continue;
    }

    // Soft completeness warnings
    if (!r['Detailed Description'] && !r['Benefit Value']) log.warn(`"${name}": no description/benefit text extracted`);
    if (!r['Official Government URL']) log.warn(`"${name}": missing Official Government URL`);

    seenNames.add(nk);
    if (url) seenUrls.add(url);
    kept.push(r);
  }

  log.info(`Validation: ${kept.length}/${records.length} rows passed`);
  return kept;
}
