'use client';

/**
 * Browser Supabase client (auth-aware).
 *
 * Uses @supabase/ssr so the session is stored in cookies and shared with the
 * server (proxy + server components/actions). Distinct from
 * `src/lib/supabase/server.ts`, which holds the non-auth public/admin clients
 * used for scheme reads and master-data writes.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  // Reuse a singleton so the same auth state / listeners are shared app-wide.
  if (!_client) {
    _client = createBrowserClient(url, anon);
  }
  return _client;
}
