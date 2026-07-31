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
import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
  type WebSocketLikeConstructor,
} from '@supabase/supabase-js'
import ws from 'ws'

/**
 * Shared options for every real-database client below.
 *
 * `realtime.transport` is the WebSocket fix, and it is REQUIRED, not optional
 * tuning. createClient() always builds a RealtimeClient, and that constructor
 * resolves its transport eagerly via
 * `options?.transport ?? WebSocketFactory.getWebSocketConstructor()`. On Node
 * versions below 22 there is no global WebSocket, so the factory throws
 * "Node.js 20 detected without native WebSocket support" — from createClient
 * itself, before a single assertion runs. Passing `ws` short-circuits the
 * factory, which is the workaround the error message itself prescribes.
 *
 * This mirrors what the application already does in src/lib/supabase/server.ts
 * (which polyfills globalThis.WebSocket for the same reason). These tests never
 * subscribe to a realtime channel; the transport exists purely so the client
 * can be constructed. Node 20 is the project's target runtime — see .nvmrc and
 * package.json#engines — so this stays needed until that deliberately changes.
 */
const TEST_CLIENT_OPTIONS: SupabaseClientOptions<'public'> = {
  auth: { persistSession: false, autoRefreshToken: false },
  // The cast is an upstream typing gap, not a shortcut. Supabase declares
  // `new (address: string | URL, subprotocols?: string | string[])`, while
  // @types/ws also carries a `new (address: null)` overload for its server-side
  // form; TypeScript resolves against that overload and rejects the assignment.
  // The runtime shapes match — the same reason src/lib/supabase/server.ts casts
  // when it assigns ws to globalThis.WebSocket.
  realtime: { transport: ws as unknown as WebSocketLikeConstructor },
}

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
  return createClient(config.url, config.anonKey, TEST_CLIENT_OPTIONS)
}

/** Service-role client for setup/teardown only. Bypasses RLS — never assert with it. */
export function createServiceTestClient(): SupabaseClient | null {
  const config = getTestDbConfig()
  if (!config?.serviceRoleKey) return null
  return createClient(config.url, config.serviceRoleKey, TEST_CLIENT_OPTIONS)
}
