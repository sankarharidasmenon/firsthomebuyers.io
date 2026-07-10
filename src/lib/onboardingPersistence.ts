'use client';

/**
 * Onboarding data persistence helper.
 *
 * This is the ONLY place that decides where onboarding step answers
 * come from.  It implements a simple priority:
 *
 *   Authenticated  →  Supabase
 *   Guest          →  localStorage
 *
 * After this function resolves, all downstream code (onboarding page,
 * results pages, calculators) continues reading from localStorage as
 * it always has.  The function is responsible for populating localStorage
 * from Supabase when the user is authenticated.
 *
 * Migration (guest → Supabase) happens inside migrateGuestDataIfAny(),
 * which is called by AuthProvider immediately before this function on
 * the first sign-in.  This function therefore only needs to handle
 * the "load from Supabase → write to localStorage" half.
 *
 * @returns true if any onboarding answers were found and hydrated into
 *          localStorage; false if the user has no answers anywhere.
 */
import type { User } from '@supabase/supabase-js';
import {
  loadOnboardingAnswers,
} from '@/lib/scenarios/actions';
import {
  getStep1, getStep2, getStep3, getStep4,
  setStep1, setStep2, setStep3, setStep4,
  type Step1Data, type Step2Data, type Step3Data, type Step4Data,
} from '@/lib/localStorage';

/**
 * Resolve onboarding answers for the current session.
 *
 * Authenticated:
 *   1. Fetch onboarding row from Supabase.
 *   2. If found → write into localStorage → return true.
 *   3. If not found but localStorage has answers → they will be
 *      migrated by migrateGuestDataIfAny (already called before this).
 *      Return whether localStorage has answers.
 *   4. If not found and no localStorage → return false.
 *
 * Guest:
 *   Return whether localStorage has answers (no Supabase call).
 */
export async function resolveOnboardingAnswers(user: User | null): Promise<boolean> {
  if (!user) {
    // Guest path — localStorage is the only store.
    return Boolean(getStep1() || getStep2() || getStep3() || getStep4());
  }

  // Authenticated path — Supabase is the source of truth.
  try {
    const res = await loadOnboardingAnswers();

    if (res.ok && res.data) {
      // Hydrate localStorage so all existing downstream reads work.
      if (res.data.step1 && Object.keys(res.data.step1).length > 0) {
        setStep1(res.data.step1 as unknown as Step1Data);
      }
      if (res.data.step2 && Object.keys(res.data.step2).length > 0) {
        setStep2(res.data.step2 as unknown as Step2Data);
      }
      if (res.data.step3 && Object.keys(res.data.step3).length > 0) {
        setStep3(res.data.step3 as unknown as Step3Data);
      }
      if (res.data.step4 && Object.keys(res.data.step4).length > 0) {
        setStep4(res.data.step4 as unknown as Step4Data);
      }
      return true;
    }

    // No Supabase onboarding row yet (new account or pre-migration).
    // migrateGuestDataIfAny() will have already written any guest data
    // to Supabase, so fall back to checking localStorage.
    return Boolean(getStep1() || getStep2() || getStep3() || getStep4());
  } catch {
    // Network / action error — fall back to localStorage gracefully.
    return Boolean(getStep1() || getStep2() || getStep3() || getStep4());
  }
}
