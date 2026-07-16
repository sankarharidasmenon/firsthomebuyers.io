/**
 * Next.js Proxy (formerly "middleware", renamed in Next 16).
 *
 * Two jobs:
 *  1. Refresh the Supabase session on every matched request and write the
 *     refreshed cookies back (via updateSession).
 *  2. Gate the admin area for signed-out users:
 *       - /admin/master-data → redirect to /admin/login.
 *
 * Regular user routes are open — the app has no user sign-in; all user data
 * lives in localStorage. The authoritative super_admin ROLE check is NOT
 * here — it runs in the admin page/actions/upload API (see
 * src/lib/auth/session.ts#requireSuperAdmin), per the Next.js proxy guidance
 * to never rely on proxy alone for authorization.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Admin area (super_admin enforced downstream); unauth → dedicated login page.
const ADMIN_PROTECTED = '/admin/master-data';

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && (pathname === ADMIN_PROTECTED || pathname.startsWith(`${ADMIN_PROTECTED}/`))) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
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
