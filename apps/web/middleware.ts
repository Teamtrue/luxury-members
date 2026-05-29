/**
 * middleware.ts
 * ---------------------------------------------------------------------------
 * Next.js Edge Middleware for PlutusClub.
 *
 * Responsibilities (in order):
 *   1. Apply security headers to every response.
 *   2. Redirect /admin/* to /admin/login if the admin session cookie is absent.
 *   3. Redirect /member/* to /signin if the Supabase auth cookie is absent.
 *   4. Apply lightweight rate limiting to auth and payment API endpoints.
 *
 * Design constraints:
 *   - Edge-compatible: no Node.js-only APIs (fs, net, etc.).
 *   - No database calls — DB round-trips happen inside individual route handlers.
 *   - Cookie presence is a fast heuristic; full session validation is done
 *     inside each protected page/layout via getAuthUser() / getAdminSession().
 *   - Keep this file under ~100 lines of logic (Next.js middleware runs on
 *     every matched request — latency matters).
 * ---------------------------------------------------------------------------
 */

import { NextResponse, type NextRequest } from 'next/server';
import { applySecurityHeadersMutable }    from './lib/security/headers';
import { getClientIP, assertRateLimit }   from './lib/security/rate-limit';

// ---------------------------------------------------------------------------
// Route matcher
// ---------------------------------------------------------------------------

export const config = {
  /**
   * Match all routes except Next.js internals and static assets.
   * Static files are served directly by the CDN/edge; no auth check needed.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)',
  ],
};

// ---------------------------------------------------------------------------
// Supabase auth cookie names
// ---------------------------------------------------------------------------

/**
 * Supabase SSR stores the access token in a cookie whose name follows the
 * pattern `sb-<project-ref>-auth-token`. We also check the legacy formats.
 * Since the project ref is dynamic, we match by prefix.
 */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    // New Supabase SSR format: sb-<ref>-auth-token (chunked: ...-0, ...-1, …)
    if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
      return true;
    }
    // Legacy formats used by older @supabase/auth-helpers-nextjs.
    if (cookie.name === 'sb-access-token' || cookie.name === 'sb-auth-token') {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse | Response> {
  const { pathname } = request.nextUrl;

  // ── 1. Build the passthrough response and inject security headers ─────────
  const response = NextResponse.next();
  applySecurityHeadersMutable(response);

  // ── 2. Admin route protection ─────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get('__admin_session');

    if (!adminCookie?.value) {
      // No session cookie — redirect to admin login.
      const loginUrl = new URL('/admin/login', request.url);
      // Preserve the original destination so the login page can redirect back.
      loginUrl.searchParams.set('next', pathname);
      const redirect = NextResponse.redirect(loginUrl);
      applySecurityHeadersMutable(redirect);
      return redirect;
    }

    // NOTE: Full token validation (DB lookup + expiry check) happens inside
    // the admin layout server component and individual admin API routes via
    // getAdminSession(). Middleware only does the lightweight cookie check
    // to avoid DB round-trips on every edge request.
  }

  // ── 3. Member route protection ────────────────────────────────────────────
  if (pathname.startsWith('/member')) {
    const hasSession = hasSupabaseAuthCookie(request);

    if (!hasSession) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('next', pathname);
      const redirect = NextResponse.redirect(signinUrl);
      applySecurityHeadersMutable(redirect);
      return redirect;
    }

    // Full JWT validation happens in the member layout / page server components
    // via getAuthUser(). Cookie presence is a heuristic to avoid the latency
    // of a Supabase JWKS validation on every middleware invocation.
  }

  // ── 4. API rate limiting (lightweight, edge-compatible) ──────────────────
  if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/payments/')) {
    const ip = getClientIP(request);

    // Use the appropriate limit bucket.
    // Fine-grained per-endpoint limiting (e.g. auth:send-otp) is applied
    // inside each route handler where the phone / user context is known.
    const limitKey = pathname.startsWith('/api/auth/')
      ? ('auth:login' as const)
      : ('api:general' as const);

    const rateLimitResponse = await assertRateLimit(limitKey, ip);
    if (rateLimitResponse) {
      // Rate limited — return 429 with security headers.
      applySecurityHeadersMutable(rateLimitResponse as unknown as { headers: { set(n: string, v: string): void } });
      return rateLimitResponse;
    }
  }

  return response;
}
