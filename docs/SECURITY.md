# Security — PlutusClub

This document covers every security control in the system, where it is implemented, and what gaps remain.

---

## Authentication

### Member Authentication (OTP)

Members authenticate with their phone number + 6-digit OTP. No passwords.

**Flow:**
1. `POST /api/auth/send-otp` — validates 10-digit phone with Zod, rate-limits per phone (5 attempts per 10 minutes), calls `supabase.auth.signInWithOtp({ phone: '+91' + phone })`
2. Supabase sends OTP via its SMS provider (configurable in Supabase dashboard)
3. `POST /api/auth/verify-otp` — calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
4. On success, Supabase sets two HttpOnly session cookies in the response

**OTP properties:**
- 6-digit numeric code
- 10-minute expiry (enforced by Supabase)
- Max 3 verification attempts per code before invalidation (Supabase default)
- Rate limited: 5 OTP sends per phone per 10-minute window (in `app/api/auth/send-otp/route.ts`)

**Dev shortcut (never reaches production):** Any phone + OTP `123456` is accepted in `NODE_ENV === 'development'`.

### Admin Authentication (Email + Password)

Admins authenticate with email and bcrypt-hashed password stored in Supabase Auth.

- `POST /api/admin/login` calls `supabase.auth.signInWithPassword({ email, password })`
- After sign-in, checks `user.user_metadata.role` or `user.app_metadata.role` ∈ `['admin', 'super_admin']`
- If role check fails, signs out the session before returning 403
- Supabase sets session cookies on success

**Password requirements (enforced at creation, not currently at sign-in):**
- Minimum 10 characters
- Must contain uppercase + lowercase + number + special character
- bcrypt with 12 rounds (Supabase default is configurable)

**Dev shortcut:** `admin@plutusclub.in` / `admin123` accepted in development. Remove the hardcoded check before production.

### Session Storage

Supabase SSR stores sessions in two HttpOnly cookies:
- `sb-<project-ref>-auth-token` — JWT access token (1-hour expiry by default)
- `sb-<project-ref>-auth-token-code-verifier` — PKCE verifier

Cookie attributes set by Supabase SSR library:
- `HttpOnly` — not accessible by JavaScript
- `Secure` — only sent over HTTPS (in production)
- `SameSite=Lax` — protects against most CSRF (Supabase default; upgrade to `Strict` once same-site flows are verified)
- `Path=/`

Session refresh: `middleware.ts` calls `supabase.auth.getUser()` on every protected request, which automatically refreshes the access token if near expiry and re-sets the cookie.

---

## CSRF Protection (planned)

**Target implementation:** Double-submit cookie pattern with HMAC-SHA256.

```typescript
// lib/security/csrf.ts (planned)

import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.APP_SECRET!;

export function generateCsrfToken(sessionId: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${sessionId}.${nonce}.${timestamp}`;
  const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyCsrfToken(token: string, sessionId: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [sid, nonce, timestamp, sig] = parts;
  if (sid !== sessionId) return false;
  // Token must be less than 1 hour old
  if (Date.now() - parseInt(timestamp) > 3600000) return false;
  const payload = `${sid}.${nonce}.${timestamp}`;
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

**Usage:** Server sets `X-CSRF-Token` cookie on every page render. Client reads it (not HttpOnly) and sends back in `X-CSRF-Token` request header. Middleware verifies before processing state-changing API calls.

**Current gap:** CSRF tokens are not yet implemented. Since Supabase sessions use `SameSite=Lax`, cross-site form submissions are partially mitigated, but explicit CSRF tokens should be added for all POST/PATCH/DELETE API calls.

---

## Rate Limiting

### Current Implementation

OTP rate limiting is implemented per-phone in `app/api/auth/send-otp/route.ts` using an in-memory `Map<string, { count: number; resetAt: number }>`. Window: 10 minutes, limit: 5 attempts.

**Critical flaw:** In-memory rate limiting does not work correctly with multiple serverless function instances. Two concurrent requests on different instances will both pass the check even if the limit should be exceeded.

### Target Implementation (Redis-based)

```typescript
// lib/security/rate-limit.ts (planned)

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();  // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

export interface RateLimitConfig {
  keyPrefix: string;
  windowMs: number;
  maxRequests: number;
}

export async function checkRateLimit(
  identifier: string,  // IP address or user ID or phone
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rl:${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Sliding window using sorted set
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(key);
  pipeline.expire(key, Math.ceil(config.windowMs / 1000));
  const [,, count] = await pipeline.exec() as [unknown, unknown, number, unknown];

  const allowed = count <= config.maxRequests;
  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - count),
    resetAt: now + config.windowMs,
  };
}
```

**Rate limit tiers:**

| Endpoint | Per-IP | Per-user/phone | Window |
|---------|--------|----------------|--------|
| `POST /api/auth/send-otp` | 20/10min | 5/10min | 10 min |
| `POST /api/auth/verify-otp` | 30/10min | 10/10min | 10 min |
| `POST /api/payments/create-order` | 50/min | 10/min | 1 min |
| `POST /api/bookings` | 50/min | 5/min | 1 min |
| `GET /api/deals` | 200/min | — | 1 min |
| `POST /api/admin/*` | 30/min | 10/min | 1 min |
| All other API routes | 100/min | 60/min | 1 min |

**Fallback:** If Redis is unreachable, fall back to in-memory limiting and log an alert.

---

## Password Security (Admin)

- Storage: bcrypt with 12 rounds (managed by Supabase Auth)
- Policy enforcement on creation: min 10 chars, must include [A-Z], [a-z], [0-9], [!@#$%^&*]
- Policy is enforced via Supabase Auth hooks or a pre-sign-up validation function
- No password is ever logged or returned in API responses
- Password reset uses Supabase's email-based reset flow (token in link, 1-hour expiry)

---

## Input Validation

Every API route that accepts a request body uses a Zod schema from `lib/validations.ts`.

```typescript
// lib/validations.ts — existing schemas

phoneSchema        // /^\d{10}$/ — 10-digit Indian mobile
otpSchema          // /^\d{6}$/ — 6-digit OTP
sendOtpSchema      // { phone }
verifyOtpSchema    // { phone, otp }
createBookingSchema // { deal_id, tokens_used, payment_method, delivery_address, notes }
createDealSchema   // { title, category, club_price, retail_price, min_tier, expires_at, ... }
updateMemberSchema // { tier?, status?, name?, email? }
memberSignupSchema // { name, email, phone, tier, referred_by? }
paymentVerifySchema // { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id? }
adminLoginSchema   // { email, password }
```

Validation pattern in every route:
```typescript
const validation = validate(schema, body);
if ('error' in validation) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

The `validate()` helper returns `{ data: T }` on success or `{ error: string; details: ZodIssue[] }` on failure. Never expose raw Zod error details to clients in production (they may leak schema structure).

**Missing:** Path parameters (e.g., `deal_id` in URL) are not validated with Zod in current routes. Add UUID validation: `z.string().uuid()`.

---

## HTTP Security Headers

Target headers to set in `next.config.js` under `headers`:

```javascript
// next.config.js (planned additions)
{
  key: 'X-Frame-Options',
  value: 'DENY',
  // Prevents clickjacking
},
{
  key: 'X-Content-Type-Options',
  value: 'nosniff',
  // Prevents MIME-type sniffing
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin',
  // Limits referrer info sent to third parties
},
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload',
  // Forces HTTPS for 2 years; submit to HSTS preload list
},
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()',
  // Disable browser APIs not used by the app
},
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
    "frame-src https://api.razorpay.com",
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
  ].join('; '),
  // Strict CSP; unsafe-inline for styles is acceptable with current inline style approach
},
```

**Current state:** No custom headers are configured in `next.config.js`. Vercel adds some headers by default but not CSP or HSTS.

---

## Row-Level Security

Every member-facing table has RLS enabled. See `docs/DATABASE.md` for the full policy list.

Core principle: **members can only read and write their own rows.** The `auth.uid()` function returns the Supabase Auth user ID from the JWT in the session cookie. Every policy compares this against the row's member/user ID column.

**Admin bypass:** Routes using `SUPABASE_SERVICE_ROLE_KEY` bypass all RLS policies. The service role key must never appear in browser-side code or be logged.

**Never expose the service role key:**
- Not in `NEXT_PUBLIC_*` env vars
- Not in API responses
- Not in error messages or logs

---

## Audit Logging

Every admin mutation must call `logAudit()` from `lib/audit.ts`.

```typescript
// lib/audit.ts

await logAudit({
  action: 'member.tier_changed',
  actor_id: adminUser.id,
  target_id: memberId,
  details: { from_tier: 'gold', to_tier: 'platinum' },
  ip: request.headers.get('x-forwarded-for') ?? 'unknown',
});
```

**Current state:** `logAudit()` pushes to an in-memory array and logs to console. In production, it must insert into the `audit_logs` Supabase table using the service role key.

**Production implementation:**
```typescript
// lib/audit.ts — replace in-memory push with:
const supabase = createServiceRoleClient();
await supabase.from('audit_logs').insert({
  action: entry.action,
  actor_id: entry.actor_id,
  target_id: entry.target_id ?? null,
  details: entry.details,
  ip: entry.ip ?? null,
  timestamp: entry.timestamp,
});
```

**SIEM forwarding:** If `SIEM_WEBHOOK_URL` is set in env, audit events are also forwarded:
```typescript
if (process.env.SIEM_WEBHOOK_URL) {
  await fetch(process.env.SIEM_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullEntry),
  }).catch(err => console.error('SIEM forward failed:', err));
}
```

The SIEM forward must not block the primary audit write — use fire-and-forget with `.catch()`.

---

## Payment Security

### Signature Verification

Every payment confirmation must verify the Razorpay HMAC-SHA256 signature before marking a booking as confirmed. Implemented in `lib/razorpay.ts`:

```typescript
export function verifyRazorpaySignature(orderId, paymentId, signature): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}
```

**Timing-safe comparison is missing.** Replace the last line with:
```typescript
return crypto.timingSafeEqual(
  Buffer.from(expectedSignature, 'hex'),
  Buffer.from(signature, 'hex')
);
```

String equality (`===`) is vulnerable to timing attacks. `timingSafeEqual` runs in constant time.

### Webhook Verification

`app/api/webhooks/razorpay/route.ts` reads the raw body (before JSON parsing) and verifies the `x-razorpay-signature` header using HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`. This is implemented correctly.

**Idempotency (TODO):** The webhook handler must be idempotent. Before processing `payment.captured`, check if `bookings.status` is already `'confirmed'` to avoid crediting tokens twice.

---

## Secrets Management

**Rules:**
1. No secret is hardcoded in source code
2. All secrets are loaded from environment variables at runtime
3. Provider credentials are stored encrypted in the `provider_config` DB table using AES-256-GCM
4. The `ENCRYPTION_KEY` is the only key that must be kept outside the database
5. `SUPABASE_SERVICE_ROLE_KEY` never appears in browser-accessible code
6. `RAZORPAY_KEY_SECRET` never sent to client (only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public)

**In Vercel:** All secrets are stored as encrypted environment variables in the Vercel dashboard. Preview deployments use separate test keys.

**Secret rotation (TODO):** No automated rotation is in place. Planned: use a secrets vault (AWS Secrets Manager or HashiCorp Vault) with 90-day rotation for all provider keys.

---

## Internal Job Security

Cron job API routes (`/api/internal/*`) must be protected with a bearer token:

```typescript
// In every /api/internal/*/route.ts
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth || auth !== `Bearer ${process.env.INTERNAL_JOB_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... job logic
}
```

`INTERNAL_JOB_TOKEN` must be a random 64-character hex string. Vercel Cron sends it in the `Authorization` header. See `docs/DEPLOYMENT.md` for Vercel Cron configuration.

---

## Known Security Gaps (TODO)

| Gap | Risk | Planned solution |
|-----|------|-----------------|
| In-memory rate limiting | Multiple serverless instances bypass limits | Redis via Upstash |
| CSRF tokens not implemented | State-changing requests vulnerable to CSRF | Double-submit cookie pattern |
| No HTTP security headers | Clickjacking, XSS, MIME sniffing risks | Add in next.config.js |
| `timingSafeEqual` missing in signature verify | Timing oracle on payment verification | Replace `===` with `timingSafeEqual` |
| Dev credentials in production code | admin@plutusclub.in/admin123 reachable | Gate by `NODE_ENV` check (already done) + remove before deploy |
| No WAF | Bot attacks, SQL injection from unexpected vectors | Cloudflare WAF in front of Vercel |
| No bot protection | Account enumeration via OTP flow | Cloudflare Turnstile or hCaptcha on sign-in |
| No secret rotation | Long-lived credentials are a breach risk | AWS Secrets Manager with 90-day rotation |
| Audit log is in-memory | Audit trail lost on function restart | Wire to Supabase audit_logs table |
| Admin password policy not enforced at sign-in | Weak passwords can be set | Supabase Auth password policy config |
| Path parameters not Zod-validated | Potential injection via URL | Add UUID validation to all [id] params |
