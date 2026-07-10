/**
 * Server-side Supabase clients.
 *
 *  - publicClient  → anon key. Respects Row Level Security (public read only).
 *                    Used by the read APIs.
 *  - adminClient   → service-role key. Bypasses RLS. Used ONLY by the upload/
 *                    import flow. Never expose this to the browser.
 *
 * Both are created lazily so a missing env var throws a clear error at call
 * time rather than at import time.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

// supabase-js instantiates a Realtime client that requires a global WebSocket.
// Node < 22 has none natively, so polyfill it (server-only module).
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = ws as unknown;
}

// Env is read LAZILY inside the getters (not at module load) so it works both in
// the Next runtime and in standalone scripts that load .env before first use.
let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function getPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  if (!_public) {
    _public = createClient(url, anon, { auth: { persistSession: false } });
  }
  return _public;
}

export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error('Supabase admin not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!_admin) {
    _admin = createClient(url, service, { auth: { persistSession: false } });
  }
  return _admin;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
