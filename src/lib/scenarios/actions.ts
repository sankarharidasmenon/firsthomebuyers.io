'use server';

/**
 * Server actions for user-owned saved scenarios / results snapshots.
 *
 * All writes go through the auth-aware server client, so Supabase RLS
 * (owner-only, see 0002_auth_profiles.sql) is the security boundary — we still
 * pass user_id explicitly for clarity and to satisfy the INSERT check.
 *
 * Data model (one `saved_scenarios` table, `kind` distinguishes the two):
 *  - kind 'result'   → the My-Results baseline snapshot. answers carries
 *      { state, firstName, grantsTotal }; borrowing_results = { min, max };
 *      eligible_schemes = string[] of eligible grant names/ids.
 *  - kind 'scenario' → a "what if" slider exploration. answers carries
 *      { sliders: { extraSavings, incomeIncrease, hasPartner, partnerIncome } };
 *      borrowing_results = { min, max }.
 */
import { getServerAuthClient } from '@/lib/supabase/serverAuth';

export interface BorrowingResult {
  min: number;
  max: number;
}

export interface ScenarioRow {
  id: string;
  scenario_name: string | null;
  kind: 'result' | 'scenario';
  answers: Record<string, unknown>;
  borrowing_results: BorrowingResult;
  eligible_schemes: string[];
  created_at: string;
  updated_at: string;
}

export interface SaveScenarioInput {
  scenarioName?: string;
  sliders: {
    extraSavings: number;
    incomeIncrease: number;
    hasPartner: boolean;
    partnerIncome: number;
  };
  result: BorrowingResult;
}

export interface SaveResultInput {
  scenarioName?: string;
  firstName: string;
  state: string;
  grantsTotal: number;
  eligibleGrants: string[];
  borrowing: BorrowingResult;
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Save a "what if" slider scenario. */
export async function saveScenario(
  input: SaveScenarioInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'You need to be signed in to save.' };

  const { data, error } = await supabase
    .from('saved_scenarios')
    .insert({
      user_id: userId,
      scenario_name: input.scenarioName ?? null,
      kind: 'scenario',
      answers: { sliders: input.sliders },
      borrowing_results: input.result,
      eligible_schemes: [],
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: data.id as string } };
}

/** Save (or replace) the My-Results baseline snapshot. */
export async function saveResult(
  input: SaveResultInput
): Promise<ActionResult<{ id: string }>> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'You need to be signed in to save.' };

  // Keep a single baseline snapshot per user: remove any prior 'result' rows.
  await supabase
    .from('saved_scenarios')
    .delete()
    .eq('user_id', userId)
    .eq('kind', 'result');

  const { data, error } = await supabase
    .from('saved_scenarios')
    .insert({
      user_id: userId,
      scenario_name: input.scenarioName ?? 'Current Position',
      kind: 'result',
      answers: {
        state: input.state,
        firstName: input.firstName,
        grantsTotal: input.grantsTotal,
      },
      borrowing_results: input.borrowing,
      eligible_schemes: input.eligibleGrants,
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: data.id as string } };
}

/** List all of the current user's saved rows, newest first. */
export async function listScenarios(): Promise<ActionResult<ScenarioRow[]>> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const { data, error } = await supabase
    .from('saved_scenarios')
    .select('id, scenario_name, kind, answers, borrowing_results, eligible_schemes, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data as ScenarioRow[]) ?? [] };
}

export async function renameScenario(
  id: string,
  name: string
): Promise<ActionResult> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const { error } = await supabase
    .from('saved_scenarios')
    .update({ scenario_name: name })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function deleteScenario(id: string): Promise<ActionResult> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const { error } = await supabase
    .from('saved_scenarios')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/**
 * Bulk-import guest localStorage work into Supabase on first sign-in.
 * Idempotent at the row level is not attempted here (the client only calls this
 * once, guarded by a localStorage flag) but we skip if the user already has
 * rows of the same kind to avoid obvious duplicates.
 */
export async function migrateGuestData(payload: {
  result?: SaveResultInput | null;
  scenarios?: SaveScenarioInput[];
}): Promise<ActionResult<{ inserted: number }>> {
  const supabase = await getServerAuthClient();
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: 'Not signed in.' };

  const { count } = await supabase
    .from('saved_scenarios')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Already has data → treat as migrated, do nothing.
  if ((count ?? 0) > 0) return { ok: true, data: { inserted: 0 } };

  const rows: Record<string, unknown>[] = [];
  if (payload.result) {
    rows.push({
      user_id: userId,
      scenario_name: 'Current Position',
      kind: 'result',
      answers: {
        state: payload.result.state,
        firstName: payload.result.firstName,
        grantsTotal: payload.result.grantsTotal,
      },
      borrowing_results: payload.result.borrowing,
      eligible_schemes: payload.result.eligibleGrants,
    });
  }
  for (const s of payload.scenarios ?? []) {
    rows.push({
      user_id: userId,
      scenario_name: s.scenarioName ?? null,
      kind: 'scenario',
      answers: { sliders: s.sliders },
      borrowing_results: s.result,
      eligible_schemes: [],
    });
  }

  if (rows.length === 0) return { ok: true, data: { inserted: 0 } };

  const { error } = await supabase.from('saved_scenarios').insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { inserted: rows.length } };
}
