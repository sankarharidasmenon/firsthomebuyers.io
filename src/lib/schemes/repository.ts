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
  price_cap_variations: string | null;
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

/**
 * Featured schemes for homepage cards: highest priority (lowest number) first.
 *
 * Only programs still taking applicants are surfaced. Closed ones stay in the
 * table as the record of what a scheme was (the NSW Shared Equity Home Buyer
 * Helper pilot, closed 30 June 2024, is still named as current by some 2026
 * guides) but never reach the UI.
 */
export async function listFeatured(limit = 6): Promise<Scheme[]> {
  const all = await listSchemes();
  const active = all.filter((s) => !s.status || /active|open/i.test(String(s.status)));
  return active.slice(0, limit);
}
function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
