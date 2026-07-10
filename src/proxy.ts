/**
 * Next.js Proxy (formerly "middleware", renamed in Next 16).
 *
 * Two jobs:
 *  1. Refresh the Supabase session on every matched request and write the
 *     refreshed cookies back (via updateSession).
 *  2. Optimistically gate protected routes for signed-out users:
 *       - /my-results, /profile → redirect to `/?next=<path>` (opens the auth
 *         modal; after auth the app routes back to <path>).
 *       - /admin/master-data    → redirect to /admin/login.
 *
 * The authoritative super_admin ROLE check is NOT here — it runs in the admin
 * page/actions/upload API (see src/lib/auth/session.ts#requireSuperAdmin), per
 * the Next.js proxy guidance to never rely on proxy alone for authorization.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Routes that require any authenticated user (modal-based sign-in).
const USER_PROTECTED = ['/my-results', '/profile'];
// Admin area (super_admin enforced downstream); unauth → dedicated login page.
const ADMIN_PROTECTED = '/admin/master-data';

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user) {
    if (pathname === ADMIN_PROTECTED || pathname.startsWith(`${ADMIN_PROTECTED}/`)) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (USER_PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (route handlers do their own auth)
     * - _next/static, _next/image (build assets)
     * - favicon.ico, sitemap.xml, robots.txt (metadata)
     * - common static asset extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
