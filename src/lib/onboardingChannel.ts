'use client';

/**
 * Onboarding invalidation channel.
 *
 * When a profile save (or any other onboarding write) finishes:
 *   1. localStorage is already updated with the new values.
 *   2. dispatchOnboardingUpdated() fires BOTH:
 *        – a same-tab window event   → notifies mounted components in the
 *          current tab to re-read localStorage immediately.
 *        – a BroadcastChannel message → notifies other open tabs in the
 *          same origin, enabling cross-tab synchronisation.
 *
 * Consumers call subscribeOnboardingUpdated(handler) in a useEffect and
 * return the unsubscribe function as the cleanup — the handler simply
 * re-reads localStorage and updates local state.
 *
 * No React context or server round-trip is involved; this is intentionally
 * a thin client-only signal.
 */

const EVENT_NAME = 'onboarding-updated';
const CHANNEL_NAME = 'firstnest-onboarding';

/**
 * Fire the onboarding-updated signal to every listener in the current tab
 * and in all other tabs sharing the same origin.
 *
 * Call this AFTER localStorage has been updated with the new values so
 * consumers can safely call getStep1/2/3/4() in the handler.
 */
export function dispatchOnboardingUpdated(): void {
  if (typeof window === 'undefined') return;

  // Same-tab notification
  window.dispatchEvent(new Event(EVENT_NAME));

  // Cross-tab notification
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ type: EVENT_NAME });
    ch.close();
  } catch {
    // BroadcastChannel is not available in some older environments.
    // The same-tab window event still fires, so intra-tab sync works.
  }
}

/**
 * Subscribe to onboarding-updated events from any tab.
 *
 * Returns an unsubscribe function suitable for use as a useEffect cleanup:
 *
 *   useEffect(() => {
 *     return subscribeOnboardingUpdated(() => {
 *       setData(resolveFromLocalStorage())
 *     })
 *   }, [])
 */
export function subscribeOnboardingUpdated(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(EVENT_NAME, handler);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.addEventListener('message', handler);
  } catch {
    // ignore — same-tab event listener is still active
  }

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    if (bc) bc.close();
  };
}
