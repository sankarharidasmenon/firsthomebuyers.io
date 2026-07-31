/**
 * Gate for tests that need a REAL Postgres behind Supabase.
 *
 * Some behaviour cannot be proved with a test double — Row Level Security is
 * the main one. A policy either holds in the database or it does not, and a
 * mock that "returns an error for anonymous select" proves only that the mock
 * was configured, never that the deployed policy works.
 *
 * Those tests therefore live in `*.realdb.integration.test.ts` files and are
 * SKIPPED unless a dedicated Supabase TEST project is configured. They must
 * never be pointed at staging or production: they write rows.
 *
 * Required environment (see .env.example and the CI secrets list):
 *   SUPABASE_TEST_URL       - test project URL
 *   SUPABASE_TEST_ANON_KEY  - test project anon/publishable key
 * Optional:
 *   SUPABASE_TEST_SERVICE_ROLE_KEY - for setup/teardown that must bypass RLS
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface TestDbConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export function getTestDbConfig(): TestDbConfig | null {
  const url = process.env.SUPABASE_TEST_URL
  const anonKey = process.env.SUPABASE_TEST_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey, serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY }
}

/** True when a real test database is configured. */
export const hasTestDb = getTestDbConfig() !== null

/**
 * Explains, once per suite, why the real-database tests did not run.
 * Deliberately noisy: a silently skipped security test is worse than a loud one.
 */
export function explainSkip(suite: string): void {
  console.warn(
    `[skipped] ${suite} requires a dedicated Supabase TEST project. ` +
      'Set SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY to enable. ' +
      'Never point these at staging or production — they write rows.',
  )
}

/** Anonymous client: the same privilege level as a signed-out visitor. */
export function createAnonTestClient(): SupabaseClient {
  const config = getTestDbConfig()
  if (!config) throw new Error('No test database configured; guard with `hasTestDb` first.')
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Service-role client for setup/teardown only. Bypasses RLS — never assert with it. */
export function createServiceTestClient(): SupabaseClient | null {
  const config = getTestDbConfig()
  if (!config?.serviceRoleKey) return null
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
