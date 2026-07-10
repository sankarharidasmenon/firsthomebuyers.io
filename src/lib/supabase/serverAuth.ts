/**
 * Per-request, auth-aware server Supabase client for RSC, Route Handlers and
 * Server Actions. Reads/writes the session via the Next.js cookie store.
 *
 * Create a NEW client for every server render (never share across requests).
 * In pure Server Components cookies are read-only, so `setAll` is wrapped in a
 * try/catch — the proxy (`src/proxy.ts`) is responsible for refreshing and
 * writing session cookies on navigation.
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getServerAuthClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore — proxy.ts refreshes the session on navigation.
        }
      },
    },
  });
}
