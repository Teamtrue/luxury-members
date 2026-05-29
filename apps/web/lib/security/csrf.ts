/**
 * lib/security/csrf.ts
 * ---------------------------------------------------------------------------
 * CSRF protection using the Double-Submit Cookie pattern.
 *
 * Pattern:
 *   1. Server generates a token = HMAC(sessionId + timestamp) and sets it
 *      as an __Host- prefixed cookie (HttpOnly=false so JS can read it).
 *   2. The client reads the cookie and forwards it in the `x-csrf-token` header
 *      on every state-mutating request (POST, PUT, PATCH, DELETE).
 *   3. The server recomputes the expected HMAC and compares it to the header
 *      value with a timing-safe comparison, also checking the token age.
 *
 * The __Host- prefix enforces: Secure, no Domain attribute, Path=/.
 * This prevents subdomain-injection attacks even on shared hosting.
 * ---------------------------------------------------------------------------
 */

import { createHmac, timingSafeEqual } from './tokens';

/** HMAC secret for CSRF token generation. Prefers CSRF_SECRET, falls back to APP_SECRET. */
const CSRF_SECRET: string = (() => {
  const s = process.env.CSRF_SECRET ?? process.env.APP_SECRET
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET env var is required for CSRF protection')
    }
    return 'dev-csrf-fallback-not-for-production'
  }
  return s
})()

/** Cookie name — __Host- prefix enforces Secure + Path=/ + no Domain. */
export const CSRF_COOKIE = '__Host-csrf';

/** Request header the client must echo the token back in. */
export const CSRF_HEADER = 'x-csrf-token';

/** Token validity window in milliseconds (1 hour). */
const TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Generate a CSRF token bound to a specific session.
 *
 * Token format: `{timestamp}.{hmac}` where:
 *   - `timestamp` is milliseconds since epoch (base-36 encoded, shorter than decimal)
 *   - `hmac` is HMAC-SHA256 of `{sessionId}:{timestamp}` truncated to 32 hex chars
 *
 * @param sessionId - Unique identifier for the current session (Supabase user ID or admin session ID).
 * @returns URL-safe CSRF token string.
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString(36); // base-36 for compactness
  const message = `${sessionId}:${timestamp}`;
  const mac = createHmac(CSRF_SECRET, message).slice(0, 32);
  return `${timestamp}.${mac}`;
}

/**
 * Validate a CSRF token against the expected value for a session.
 *
 * Checks:
 *   1. Token has the expected `{timestamp}.{mac}` format.
 *   2. Timestamp is not older than TOKEN_TTL_MS (1 hour).
 *   3. HMAC matches what we would generate for this sessionId + timestamp.
 *
 * @param token     - The raw token string from the `x-csrf-token` header.
 * @param sessionId - The session ID to validate against.
 * @returns `true` if valid, `false` if invalid or expired.
 */
export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampB36, mac] = parts;

  // Validate timestamp
  const timestamp = parseInt(timestampB36, 36);
  if (isNaN(timestamp)) return false;

  const age = Date.now() - timestamp;
  if (age < 0 || age > TOKEN_TTL_MS) return false;

  // Recompute expected MAC
  const message = `${sessionId}:${timestampB36}`;
  const expectedMac = createHmac(CSRF_SECRET, message).slice(0, 32);

  // Timing-safe comparison
  return timingSafeEqual(mac, expectedMac);
}

/**
 * Extract the CSRF token from request cookies.
 *
 * @param request - The incoming HTTP Request object.
 * @returns The raw CSRF cookie value, or `null` if the cookie is absent.
 */
export function getCsrfFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key?.trim() ?? '', val.join('=')];
    })
  );
  return cookies[CSRF_COOKIE] ?? null;
}

/**
 * Middleware helper: assert the incoming request passes CSRF validation.
 *
 * Safe methods (GET, HEAD, OPTIONS) are automatically skipped — they must
 * not mutate state, so CSRF does not apply.
 *
 * @param request   - The incoming HTTP Request.
 * @param sessionId - The authenticated session ID to validate against.
 * @returns A 403 JSON Response if validation fails, or `null` if the request is safe to proceed.
 */
export function assertCsrf(request: Request, sessionId: string): Response | null {
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (safeMethods.has(request.method.toUpperCase())) return null;

  const tokenFromHeader = request.headers.get(CSRF_HEADER);
  if (!tokenFromHeader) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing CSRF token.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!validateCsrfToken(tokenFromHeader, sessionId)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid or expired CSRF token.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

// Aliases matching the zip's test API surface
export { generateCsrfToken as createCsrfToken, validateCsrfToken as verifyCsrfToken };
