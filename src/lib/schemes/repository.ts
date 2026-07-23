/**
 * Scheme read repository — the ONLY place the app reads scheme data.
 *
 * Everything comes from Supabase (public/anon client, RLS: public read). No
 * hardcoded scheme data. Deterministic eligibility filtering uses db columns
 * generically (no hardcoded scheme names).
 */
import { getPublicClient } from '../supabase/server';

/** A scheme as stored (db columns). All 56 fields are text. */
export interface Scheme {
  id: string;
  scheme_id: string;
  scheme_name: string;
  acronym: string | null;
  type: string | null;
  level: string | null;
  administering_body: string | null;
  short_description: string | null;
  detailed_description: string | null;
  applicable_states: string | null;
  benefit_type: string | null;
  benefit_value: string | null;
  value_unit: string | null;
  max_value_cap: string | null;
  first_home_buyer_required: string | null;
  owner_occupier_required: string | null;
  citizenship_residency: string | null;
  income_cap_single: string | null;
  income_cap_couple: string | null;
  property_price_cap: string | null;
  eligible_property_types: string | null;
  new_vs_established: string | null;
  minimum_deposit: string | null;
  status: string | null;
  official_url: string;
  eligibility_tag: string | null;
  priority_ranking: string | null;
  catchy_line: string | null;
  imported_at: string;
  // …plus the remaining columns (returned by select('*')).
  [key: string]: unknown;
}

export interface EligibilityQuery {
  state?: string; // e.g. "VIC"
  firstHomeBuyer?: boolean;
  income?: number; // annual, single or combined
  hasPartner?: boolean;
  propertyPrice?: number;
  propertyType?: string; // 'house' | 'townhouse' | 'apartment' | 'offplan'
  singleParent?: boolean;
  deposit?: number;
}

const ORDER = { column: 'priority_ranking', ascending: true } as const;

/** All active schemes, ordered by priority then name. */
export async function listSchemes(): Promise<Scheme[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('government_schemes')
    .select('*')
    .order(ORDER.column, { ascending: ORDER.ascending, nullsFirst: false })
    .order('scheme_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Scheme[];
}

export async function getScheme(id: string): Promise<Scheme | null> {
  const supabase = getPublicClient();
  // Match the business scheme_id first (parameter-safe .eq), then the uuid.
  const byBusinessId = await supabase
    .from('government_schemes')
    .select('*')
    .eq('scheme_id', id)
    .limit(1)
    .maybeSingle();
  if (byBusinessId.error) throw new Error(byBusinessId.error.message);
  if (byBusinessId.data) return byBusinessId.data as Scheme;

  if (isUuid(id)) {
    const byUuid = await supabase
      .from('government_schemes')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (byUuid.error) throw new Error(byUuid.error.message);
    return (byUuid.data as Scheme) ?? null;
  }
  return null;
}

/** Featured schemes for homepage cards: highest priority (lowest number) first. */
export async function listFeatured(limit = 6): Promise<Scheme[]> {
  const all = await listSchemes();
  const active = all.filter((s) => !s.status || /active|open/i.test(String(s.status)));
  return active.slice(0, limit);
}

/**
 * Eligible schemes for a user's answers — deterministic filtering on db columns
 * (never on hardcoded scheme names).
 */
export async function listEligible(q: EligibilityQuery): Promise<Scheme[]> {
  const all = await listSchemes();
  return all.filter((s) => matchesEligibility(s, q));
}

function matchesEligibility(s: Scheme, q: EligibilityQuery): boolean {
  // Never offer a scheme that is no longer available — closed, ended, expired,
  // or merged/superseded into another program (e.g. the Regional First Home
  // Buyer Guarantee, merged into the First Home Guarantee on 1 Oct 2025). A blank
  // or "active"/"open" status is treated as available.
  if (/\b(closed|ended|expired|merged|superseded|replaced|inactive|no longer)\b/i.test(String(s.status || ''))) {
    return false;
  }

  // State / jurisdiction: federal schemes ("All States & Territories") apply
  // everywhere. NOTE: match "ALL STATES/TERRITORIES" — never a bare "AUSTRALIA",
  // which also appears inside "Western Australia" / "South Australia".
  if (q.state) {
    const states = String(s.applicable_states || '').toUpperCase();
    const federal = /ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states);
    if (!federal && states) {
      const code = q.state.toUpperCase().replace(/[^A-Z]/g, '');
      // Match the jurisdiction code as a whole token, e.g. "VIC (VICTORIA)".
      const matches = new RegExp(`\\b${code}\\b`).test(states);
      if (!matches) return false;
    }
  }

  // First home buyer requirement. Treat a scheme as first-home-buyer-only when
  // ANY reliable signal says so — not just the first_home_buyer_required column,
  // which can arrive blank from an imported spreadsheet (this is what leaked the
  // First Home Super Saver scheme to prior owners). Inferring from the scheme
  // name and prior-ownership wording keeps the filter correct across re-imports
  // even when that one cell is empty.
  if (q.firstHomeBuyer === false && schemeRequiresFirstHomeBuyer(s)) {
    return false;
  }

  // Income cap (use couple cap when a partner is present, else single).
  if (typeof q.income === 'number') {
    const capText = q.hasPartner ? s.income_cap_couple : s.income_cap_single;
    const cap = parseMoney(capText);
    if (cap !== null && q.income > cap) return false;
  }

  // Property price cap.
  if (typeof q.propertyPrice === 'number') {
    const cap = parseMoney(s.property_price_cap);
    if (cap !== null && q.propertyPrice > cap) return false;
  }

  // Property type — only exclude on a clear mismatch (schemes that list specific
  // eligible types and none matches the user's type). Conservative to avoid
  // wrongly excluding broadly-eligible schemes.
  if (q.propertyType && !propertyTypeAllowed(s, q.propertyType)) return false;

  // Single parent — a scheme that REQUIRES a single parent is excluded only when
  // the user explicitly indicated they are NOT one. Unknown → keep it.
  if (q.singleParent === false && /yes/i.test(String((s as { single_parent_required?: unknown }).single_parent_required ?? ''))) {
    return false;
  }

  return true;
}

/**
 * Whether a scheme is restricted to first home buyers. Robust to incomplete
 * imported data: the explicit first_home_buyer_required column is authoritative
 * when it clearly says Yes or No, but when it is blank/ambiguous the requirement
 * is inferred from the scheme name/acronym ("First Home …") and prior-ownership
 * wording. This prevents a blank cell from leaking an FHB-only scheme (e.g.
 * First Home Super Saver) to someone who has previously owned property.
 */
function schemeRequiresFirstHomeBuyer(s: Scheme): boolean {
  const explicit = String(s.first_home_buyer_required || '').trim();
  if (/yes/i.test(explicit)) return true;
  if (/^no\b/i.test(explicit)) return false; // an explicit "No" is authoritative
  // Column blank/unknown → infer from strong secondary signals.
  const name = `${s.scheme_name || ''} ${s.acronym || ''}`;
  if (/first[\s-]?home/i.test(name)) return true;
  if (/(must not|never|not)\b[^.]*\bown/i.test(String(s.prior_ownership_rules || ''))) return true;
  return false;
}

const PROPERTY_TYPE_KEYWORDS: Record<string, string[]> = {
  house: ['house', 'home', 'dwelling', 'residential', 'new home', 'established'],
  townhouse: ['townhouse', 'town house', 'home', 'dwelling', 'residential'],
  apartment: ['apartment', 'unit', 'home', 'dwelling', 'residential'],
  offplan: ['off-the-plan', 'off the plan', 'new', 'home', 'residential'],
};

function propertyTypeAllowed(s: Scheme, propertyType: string): boolean {
  const types = String(s.eligible_property_types || '').toLowerCase();
  if (!types) return true; // scheme doesn't restrict → allowed
  if (types.includes('property')) return true; // broadly worded
  const kws = PROPERTY_TYPE_KEYWORDS[propertyType.toLowerCase()] ?? [];
  if (kws.length === 0) return true;
  return kws.some((k) => types.includes(k));
}

function parseMoney(value: unknown): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
