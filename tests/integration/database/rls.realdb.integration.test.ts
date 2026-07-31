import { describe, it, expect, beforeAll } from 'vitest'
import { createAnonTestClient, explainSkip, hasTestDb } from '../helpers/testDb'

/**
 * INTEGRATION (REAL DATABASE REQUIRED) — Row Level Security.
 *
 * ============================================================================
 * THIS SUITE IS SKIPPED unless SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY
 * point at a DEDICATED Supabase test project. See tests/integration/helpers/
 * testDb.ts and the prerequisites section of the Phase 3 report.
 * ============================================================================
 *
 * WHY THESE CANNOT BE MOCKED
 * Every other integration suite here mocks the Supabase driver, which is right
 * for testing how the application talks to the database. It is useless for RLS.
 * A policy is enforced by Postgres, not by application code: a mock configured
 * to "return an error for an anonymous select" proves only that the mock was
 * configured that way. The policies in supabase/migrations/0004_feedback.sql
 * are a security control, and the only honest test of a security control is to
 * attempt the thing it is supposed to prevent, against the real system.
 *
 * SAFETY
 * These tests INSERT rows. Point them at a throwaway project only — never at
 * staging or production. They deliberately use the anon key, so they hold
 * exactly the privileges of a signed-out visitor.
 *
 * PREREQUISITE
 * All migrations in supabase/migrations/ must be applied to the test project,
 * including 0004_feedback.sql. Without it these fail on a missing relation
 * rather than on a policy, which is a meaningfully different failure.
 */

if (!hasTestDb) explainSkip('RLS integration suite')

describe.skipIf(!hasTestDb)('feedback table — Row Level Security', () => {
  let anon: ReturnType<typeof createAnonTestClient>

  beforeAll(() => {
    anon = createAnonTestClient()
  })

  it('allows an anonymous visitor to submit feedback', async () => {
    const { error } = await anon.from('feedback').insert({
      feedback_type: 'bug',
      message: 'Integration test submission — safe to delete.',
      page_url: 'https://example.test/integration',
      theme: 'light',
      user_id: null,
    })

    expect(error).toBeNull()
  })

  /**
   * The insert policy is `user_id IS NULL OR user_id = auth.uid()`. An
   * anonymous caller has no auth.uid(), so attributing a row to a real user
   * must be refused — otherwise anyone could forge feedback in someone's name.
   */
  it('refuses an anonymous caller attributing feedback to a user', async () => {
    const { error } = await anon.from('feedback').insert({
      feedback_type: 'bug',
      message: 'Attempting to forge attribution — must be rejected.',
      user_id: '00000000-0000-0000-0000-000000000001',
    })

    expect(error).not.toBeNull()
  })

  /** Submitters must never be able to read the feedback inbox back. */
  it('refuses to return any feedback rows to an anonymous caller', async () => {
    const { data, error } = await anon.from('feedback').select('*').limit(5)

    // RLS with no matching SELECT policy yields an empty set, not an error.
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('refuses an anonymous update', async () => {
    const { data } = await anon
      .from('feedback')
      .update({ message: 'tampered' })
      .eq('feedback_type', 'bug')
      .select()

    expect(data ?? []).toEqual([])
  })

  it('refuses an anonymous delete', async () => {
    const { data } = await anon.from('feedback').delete().eq('feedback_type', 'bug').select()

    expect(data ?? []).toEqual([])
  })

  it('enforces the message length constraint from the schema', async () => {
    const { error } = await anon.from('feedback').insert({
      feedback_type: 'bug',
      message: 'x'.repeat(1001),
    })

    expect(error).not.toBeNull()
  })

  it('rejects a feedback_type outside the allowed set', async () => {
    const { error } = await anon.from('feedback').insert({
      feedback_type: 'not-a-real-type',
      message: 'Should be rejected by the CHECK constraint.',
    })

    expect(error).not.toBeNull()
  })
})

describe.skipIf(!hasTestDb)('profiles table — Row Level Security', () => {
  it('does not expose profiles to an anonymous caller', async () => {
    const anon = createAnonTestClient()
    const { data, error } = await anon.from('profiles').select('id, email, role').limit(5)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})

describe.skipIf(!hasTestDb)('saved_scenarios table — Row Level Security', () => {
  it('does not expose saved scenarios to an anonymous caller', async () => {
    const anon = createAnonTestClient()
    const { data, error } = await anon.from('saved_scenarios').select('*').limit(5)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('refuses an anonymous insert', async () => {
    const anon = createAnonTestClient()
    const { error } = await anon.from('saved_scenarios').insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      kind: 'scenario',
    })

    expect(error).not.toBeNull()
  })
})

describe.skipIf(!hasTestDb)('government_schemes table — public read', () => {
  /** The opposite check: this table is MEANT to be publicly readable. */
  it('allows an anonymous caller to read schemes', async () => {
    const anon = createAnonTestClient()
    const { error } = await anon.from('government_schemes').select('scheme_id').limit(1)

    expect(error).toBeNull()
  })

  it('refuses an anonymous write to schemes', async () => {
    const anon = createAnonTestClient()
    const { error } = await anon.from('government_schemes').insert({
      scheme_id: 'rls-test-should-fail',
      scheme_name: 'Should Not Insert',
      official_url: 'https://example.test',
    })

    expect(error).not.toBeNull()
  })
})
