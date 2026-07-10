/**
 * Auth callback for links Supabase emails to the user (email confirmation and
 * password recovery). Exchanges the `code` for a session, writes the session
 * cookies, then redirects to `next` (defaults to home). Recovery links land on
 * /auth/reset-password so the user can set a new password.
 *
 * With email confirmation disabled (current POC) this route is exercised only
 * by the password-reset flow, but it is fully functional if confirmation is
 * later re-enabled — no code change required.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  const redirectTo = new URL(next, origin);
  const response = NextResponse.redirect(redirectTo);

  if (!code) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errUrl = new URL('/', origin);
    errUrl.searchParams.set('auth_error', '1');
    return NextResponse.redirect(errUrl);
  }

  return response;
}
