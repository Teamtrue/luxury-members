/**
 * lib/security/origin-check.ts
 * ---------------------------------------------------------------------------
 * Origin validation helpers to prevent cross-origin request forgery
 * on sensitive state-mutating endpoints.
 * ---------------------------------------------------------------------------
 */

/**
 * Return true if the request's Origin header matches the Host header.
 * Requests without an Origin header (same-origin navigations, curl, etc.)
 * are considered safe (return true).
 *
 * Use this as a secondary guard on admin and payment mutation endpoints.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) return true;  // No Origin = non-browser or same-origin nav
  if (!host) return false;

  try {
    const o = new URL(origin);
    return o.host === host;
  } catch {
    return false;
  }
}

/**
 * Return a 403 response if the request comes from a cross-origin context,
 * or null if the origin check passes.
 */
export function assertSameOrigin(request: Request): Response | null {
  if (isSameOrigin(request)) return null;
  return new Response(
    JSON.stringify({ success: false, error: 'Cross-origin request rejected.' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
