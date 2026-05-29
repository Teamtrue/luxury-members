/**
 * lib/security/headers.ts
 * ---------------------------------------------------------------------------
 * Security response headers for PlutusClub.
 *
 * Apply these on every outbound HTTP response — in middleware for page routes
 * and directly in API route handlers via `getSecurityHeaders()`.
 *
 * References:
 *   - OWASP Secure Headers Project (https://owasp.org/www-project-secure-headers/)
 *   - Mozilla Observatory (https://observatory.mozilla.org/)
 * ---------------------------------------------------------------------------
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Supabase project ref — used to scope the CSP connect-src directive.
 * Falls back to wildcard if not configured (safe for dev, not for prod).
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co';

/**
 * Build the Content Security Policy header value.
 *
 * Directives are deliberately restrictive. Adjust only when a vendor
 * explicitly requires additional sources and you have verified the need.
 *
 * NOTE: `unsafe-inline` for scripts is required by Razorpay Checkout v2 and
 * Next.js inline hydration scripts. A nonce-based approach is preferable for
 * future hardening once a CSP nonce is threaded through the rendering pipeline.
 */
function buildCSP(): string {
  const directives: Record<string, string> = {
    'default-src':  "'self'",
    'script-src':   "'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com",
    'style-src':    "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src':     "'self' https://fonts.gstatic.com",
    'img-src':      "'self' data: https:",
    'connect-src':  `'self' ${SUPABASE_URL} https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com`,
    'frame-src':    'https://api.razorpay.com https://checkout.razorpay.com',
    'object-src':   "'none'",
    'base-uri':     "'self'",
    'form-action':  "'self'",
  };

  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join('; ');
}

/**
 * Return all security headers as a plain object.
 * Suitable for passing directly to Response constructors or Next.js `headers()` config.
 *
 * @returns Key-value record of HTTP security header names and values.
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent the page from being embedded in an iframe on another origin.
    'X-Frame-Options': 'DENY',

    // Prevent browsers from MIME-sniffing the content-type.
    'X-Content-Type-Options': 'nosniff',

    // Control how much referrer info is sent with requests.
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Legacy XSS filter (still respected by some older browsers/proxies).
    'X-XSS-Protection': '1; mode=block',

    // Disable access to sensitive device APIs we don't use.
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

    // Content Security Policy.
    'Content-Security-Policy': buildCSP(),
  };

  // HSTS — only set in production (setting in dev breaks localhost HTTP).
  if (IS_PRODUCTION) {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Apply security headers to an existing Response by cloning it with the
 * additional headers merged in.
 *
 * Because `Response` headers are immutable after construction, this creates a
 * new Response that re-uses the original body and status.
 *
 * @param response - The original Response to augment.
 * @returns A new Response with all security headers applied.
 */
export function applySecurityHeaders(response: Response): Response {
  const secHeaders = getSecurityHeaders();
  const newHeaders = new Headers(response.headers);

  for (const [name, value] of Object.entries(secHeaders)) {
    newHeaders.set(name, value);
  }

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    newHeaders,
  });
}

/**
 * Apply security headers to a NextResponse (or any object with a `headers`
 * property that has a `.set()` method).
 * Mutates the response object in-place — useful in Next.js middleware where
 * you hold a mutable NextResponse reference.
 *
 * @param response - A mutable response-like object (e.g. `NextResponse`).
 */
export function applySecurityHeadersMutable(
  response: { headers: { set(name: string, value: string): void } }
): void {
  const secHeaders = getSecurityHeaders();
  for (const [name, value] of Object.entries(secHeaders)) {
    response.headers.set(name, value);
  }
}
