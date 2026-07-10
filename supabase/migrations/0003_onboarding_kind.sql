-- ============================================================================
-- FirstNest — Phase 4: Onboarding answers persistence
--
-- 1. Allow kind = 'onboarding' in saved_scenarios.
--
-- 2. Add a partial unique index on (user_id) WHERE kind = 'onboarding'
--    so the database enforces exactly one onboarding row per user.
--    The application-level SELECT→UPDATE-or-INSERT logic already guarantees
--    this, but the index provides a backstop that prevents duplicates even
--    under concurrent writes.
-- ============================================================================

-- 1. Extend the kind CHECK constraint.
ALTER TABLE public.saved_scenarios
  DROP CONSTRAINT IF EXISTS saved_scenarios_kind_check;

ALTER TABLE public.saved_scenarios
  ADD CONSTRAINT saved_scenarios_kind_check
    CHECK (kind IN ('result', 'scenario', 'onboarding'));

-- 2. One onboarding row per user — partial unique index.
--    Only rows where kind = 'onboarding' participate, so 'result' and
--    'scenario' rows (which intentionally allow multiple per user) are
--    unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS saved_scenarios_onboarding_unique_idx
  ON public.saved_scenarios (user_id)
  WHERE kind = 'onboarding';
