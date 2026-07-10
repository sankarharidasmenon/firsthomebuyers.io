'use client';

/**
 * On first sign-in, push any guest work saved in localStorage into Supabase so
 * nothing is lost. Guarded by a per-user flag so it runs at most once per
 * (user, browser) combination — different users on the same browser each get
 * their own independent migration run.
 *
 * Migrates:
 *  - My Results snapshot (kind='result')
 *  - Saved scenarios    (kind='scenario')
 *  - Onboarding answers (kind='onboarding')
 */
import {
  getMyResults, getSavedScenarios,
  getStep1, getStep2, getStep3, getStep4,
} from '@/lib/localStorage';
import {
  migrateGuestData,
  saveOnboardingAnswers,
  loadOnboardingAnswers,
  type SaveResultInput,
  type SaveScenarioInput,
} from '@/lib/scenarios/actions';

/** Returns the per-user localStorage flag key. */
function migratedFlagKey(userId: string): string {
  return `firstnest_migrated_${userId}`;
}

export async function migrateGuestDataIfAny(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;

  const flagKey = migratedFlagKey(userId);
  if (localStorage.getItem(flagKey) === '1') return 0;

  const myResults = getMyResults();
  const scenarios = getSavedScenarios();
  const step1 = getStep1();
  const step2 = getStep2();
  const step3 = getStep3();
  const step4 = getStep4();

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

  const hasAnyData = result || scenarioInputs.length > 0 || step1 || step2 || step3 || step4;

  // Nothing to migrate — still set the flag so we don't re-check every login.
  if (!hasAnyData) {
    localStorage.setItem(flagKey, '1');
    return 0;
  }

  let inserted = 0;

  // Migrate results + scenarios (existing logic).
  if (result || scenarioInputs.length > 0) {
    const res = await migrateGuestData({ result, scenarios: scenarioInputs });
    if (res.ok) inserted += res.data.inserted;
  }

  // Migrate onboarding step answers — only if Supabase doesn't have them yet.
  if (step1 || step2 || step3 || step4) {
    const existing = await loadOnboardingAnswers();
    if (existing.ok && !existing.data) {
      await saveOnboardingAnswers({
        step1: (step1 ?? {}) as Record<string, unknown>,
        step2: (step2 ?? {}) as Record<string, unknown>,
        step3: (step3 ?? {}) as Record<string, unknown>,
        step4: (step4 ?? {}) as Record<string, unknown>,
      });
      inserted += 1;
    }
  }

  localStorage.setItem(flagKey, '1');
  return inserted;
}

