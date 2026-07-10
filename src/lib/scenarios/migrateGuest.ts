'use client';

/**
 * On first sign-in, push any guest work saved in localStorage into Supabase so
 * nothing is lost. Guarded by a one-time flag so it runs at most once per
 * browser; the server action additionally no-ops if the user already has rows.
 */
import { getMyResults, getSavedScenarios } from '@/lib/localStorage';
import { migrateGuestData, type SaveResultInput, type SaveScenarioInput } from '@/lib/scenarios/actions';

const MIGRATED_FLAG = 'firstnest_migrated';

export async function migrateGuestDataIfAny(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (localStorage.getItem(MIGRATED_FLAG) === '1') return 0;

  const myResults = getMyResults();
  const scenarios = getSavedScenarios();

  const result: SaveResultInput | null = myResults
    ? {
        firstName: myResults.firstName,
        state: myResults.state,
        grantsTotal: myResults.grantsTotal,
        eligibleGrants: myResults.eligibleGrants,
        borrowing: myResults.borrowing,
      }
    : null;

  const scenarioInputs: SaveScenarioInput[] = scenarios.map((s) => ({
    sliders: s.sliders,
    result: s.result,
  }));

  // Nothing to migrate — still set the flag so we don't re-check every login.
  if (!result && scenarioInputs.length === 0) {
    localStorage.setItem(MIGRATED_FLAG, '1');
    return 0;
  }

  const res = await migrateGuestData({ result, scenarios: scenarioInputs });
  if (res.ok) {
    localStorage.setItem(MIGRATED_FLAG, '1');
    return res.data.inserted;
  }
  return 0;
}
