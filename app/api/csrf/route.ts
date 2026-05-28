/**
 * GET /api/csrf
 * ---------------------------------------------------------------------------
 * Returns a fresh CSRF token for the current authenticated session.
 * Sets the __Host-csrf cookie (SameSite=Strict, non-HttpOnly so JS can read it).
 *
 * Call this once on mount for any page that needs to POST/PATCH/DELETE.
 * Re-use the cookie value for up to 1 hour; call again if expired.
 * ---------------------------------------------------------------------------
 */

import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers';
import { generateCsrfToken, CSRF_COOKIE }    from '@/lib/security/csrf';
import { getSecurityHeaders }                from '@/lib/security/headers';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const token = generateCsrfToken(user.id);

    const cookieValue = [
      `${CSRF_COOKIE}=${token}`,
      'SameSite=Strict',
      'Secure',
      'Path=/',
      'Max-Age=3600', // 1 hour
    ].join('; ');

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
    });
    headers.append('Set-Cookie', cookieValue);

    return new Response(
      JSON.stringify({ success: true, data: { token } }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error('[GET /api/csrf] Error generating CSRF token:', err);
    return apiError('Failed to generate CSRF token.', 500);
  }
}
