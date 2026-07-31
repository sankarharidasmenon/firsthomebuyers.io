/**
 * Property price caps that vary by state/region.
 *
 * Federal schemes (the Australian Government 5% Deposit Scheme, Help to Buy)
 * publish a different cap for every state — and inside a state, a higher cap for
 * the capital city and listed regional centres than for the rest of the state.
 * A single `property_price_cap` column cannot express that, so those rows carry
 * the whole table in `price_cap_variations` and this module resolves the caps
 * that apply to one applicant's state.
 *
 * Stored format (one entry per jurisdiction, `;` separated, highest cap first):
 *
 *   NSW: $1,500,000 (Sydney and regional centres) | $800,000 (rest of NSW);
 *   VIC: $950,000 (Melbourne and Geelong) | $650,000 (rest of VIC); ACT: $1,000,000
 *
 * Rows whose variations text has no `STATE:` prefix (e.g. a state scheme listing
 * "Homes: … Vacant land: …") are ignored here — the caller falls back to the
 * single `property_price_cap` value.
 */

export interface PriceCap {
  /** Cap in dollars. */
  amount: number;
  /** The region the cap applies to, e.g. "Sydney and regional centres". */
  label: string;
}

const STATE_CODES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;

/**
 * Some caps depend on HOW the home is acquired rather than where it is: the NSW
 * First Home Owner Grant caps a completed new home at $600,000 but a
 * house-and-land build at $750,000 (land plus construction). Those rows key the
 * same column by `BUY:` and `BUILD:` instead of by state code — no state code is
 * two-or-three letters spelling BUY or BUILD, so the two formats never collide.
 */
export function resolvePurchaseCap(variations: unknown, rawPropertyType: unknown): PriceCap | null {
  if (!variations) return null;
  const key = String(rawPropertyType) === 'Land + Build' ? 'BUILD' : 'BUY';
  for (const entry of String(variations).split(';')) {
    const m = entry.match(/^\s*(BUY|BUILD)\s*:\s*(.+)$/);
    if (!m || m[1] !== key) continue;
    const hit = /\$\s*([\d,]+)\s*(?:\(([^)]*)\))?/.exec(m[2]);
    if (!hit) continue;
    const amount = Number(hit[1].replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    return { amount, label: (hit[2] ?? '').trim() };
  }
  return null;
}

/**
 * Caps that apply in `state`, highest first. Empty when the text holds no
 * per-state table or the state is not listed.
 */
export function resolveStateCaps(variations: unknown, state: string | undefined): PriceCap[] {
  if (!variations || !state) return [];
  const code = String(state).toUpperCase().replace(/[^A-Z]/g, '');
  if (!STATE_CODES.includes(code as (typeof STATE_CODES)[number])) return [];

  for (const entry of String(variations).split(';')) {
    const m = entry.match(/^\s*([A-Z]{2,3})\s*:\s*(.+)$/);
    if (!m || m[1] !== code) continue;

    const caps: PriceCap[] = [];
    const re = /\$\s*([\d,]+)\s*(?:\(([^)]*)\))?/g;
    let hit: RegExpExecArray | null;
    while ((hit = re.exec(m[2])) !== null) {
      const amount = Number(hit[1].replace(/,/g, ''));
      if (Number.isFinite(amount) && amount > 0) {
        caps.push({ amount, label: (hit[2] ?? '').trim() });
      }
    }
    return caps.sort((a, b) => b.amount - a.amount);
  }
  return [];
}

/**
 * The cap that applies to a KNOWN region, or null when the region is unknown or
 * the state publishes no per-state table.
 *
 * The published tables list the higher figure first (the capital city and any
 * listed regional centres) and the rest-of-state figure last, so a classified
 * suburb resolves to a single cap and the engine can decide instead of asking
 * the applicant to confirm. An unclassified suburb returns null and the caller
 * keeps its previous two-cap behaviour.
 */
export function resolveRegionCap(
  variations: unknown,
  state: string | undefined,
  region: 'capital' | 'regional-centre' | 'rest' | undefined,
): PriceCap | null {
  if (!region) return null
  const caps = resolveStateCaps(variations, state)
  if (caps.length === 0) return null
  if (region === 'rest') return caps[caps.length - 1]
  return caps[0]
}

/** The highest cap available in `state`, or null when none is published. */
export function highestStateCap(variations: unknown, state: string | undefined): number | null {
  const caps = resolveStateCaps(variations, state);
  return caps.length > 0 ? caps[0].amount : null;
}
