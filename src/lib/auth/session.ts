/**
 * Server-side auth helpers — the authoritative source of truth for "who is
 * this request and what may they do". Used by Server Components, Server Actions
 * and Route Handlers. Proxy is only an optimistic gate; real authorization
 * (especially the super_admin check) happens here.
 */
import type { User } from '@supabase/supabase-js';
import { getServerAuthClient } from '@/lib/supabase/serverAuth';

export type Role = 'user' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  dob: string | null;
  role: Role;
}

/** The current authenticated user, or null. */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's profile row (includes role), or null if signed out. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, dob, role')
    .eq('id', user.id)
    .single();

  return (data as Profile) ?? null;
}

/**
 * Returns the profile if the caller is a super_admin, otherwise null. Callers
 * render a 403 (or redirect to /admin/login) when this returns null.
 */
export async function requireSuperAdmin(): Promise<Profile | null> {
  const profile = await getProfile();
  if (!profile || profile.role !== 'super_admin') return null;
  return profile;
}
