/**
 * lib/security/rate-limit.ts
 * ---------------------------------------------------------------------------
 * Distributed rate limiting for PlutusClub API routes.
 *
 * Strategy (in order of preference):
 *   1. Upstash Redis REST API (UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN env vars)
 *      — Uses INCR + EXPIRE pipeline for atomic counter increments.
 *   2. In-process Map (fallback) — suitable for single-instance dev/staging.
 *      Stale entries are cleaned up every 5 minutes to prevent memory leaks.
 *
 * TODO: AI — ML-based adaptive rate limiting based on behavioral signals
 *       (e.g., increase limits for verified-good actors, tighten for anomalous
 *       traffic patterns detected by fraud scoring model).
 * ---------------------------------------------------------------------------
 */

/**
 * Per-endpoint rate limit configurations.
 *
 * `failOpen: false` — when Redis is unreachable, return 503 instead of falling
 * back to the in-process store.  Use this for auth, payment, and admin routes
 * where a misconfigured or unavailable Redis must not silently allow unlimited
 * traffic.  General API routes keep `failOpen: true` (default) so a Redis blip
 * does not take down the whole app.
 */
export const RATE_LIMITS = {
  /** OTP send: 3 requests per minute per phone number. Fail closed. */
  'auth:send-otp':    { requests: 3,   windowMs: 60_000,     failOpen: false },
  /** OTP verify: 5 attempts per 5 minutes per phone number. Fail closed. */
  'auth:verify-otp':  { requests: 5,   windowMs: 300_000,    failOpen: false },
  /** Login: 10 attempts per 15 minutes per IP. Fail closed. */
  'auth:login':       { requests: 10,  windowMs: 900_000,    failOpen: false },
  /** Payment creation: 5 per minute per user. Fail closed. */
  'payments:create':  { requests: 5,   windowMs: 60_000,     failOpen: false },
  /** Booking creation: 10 per hour per user. */
  'bookings:create':  { requests: 10,  windowMs: 3_600_000,  failOpen: true },
  /** General authenticated API: 100 per minute per IP. */
  'api:general':      { requests: 100, windowMs: 60_000,     failOpen: true },
  /** Public endpoints (no auth required): 300 per minute per IP. */
  'api:public':       { requests: 300, windowMs: 60_000,     failOpen: true },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

/** Result returned by checkRateLimit. */
export interface RateLimitResult {
  /** Whether the request is allowed under the current rate limit. */
  allowed: boolean;
  /** Number of requests remaining in the current window (0 if blocked). */
  remaining: number;
  /** Date when the current rate limit window resets. */
  resetAt: Date;
}

// ---------------------------------------------------------------------------
// In-memory fallback store
// ---------------------------------------------------------------------------

interface MemoryBucket {
  count: number;
  resetAt: number; // Unix ms timestamp
}

/** In-process rate limit buckets — only used when Redis is unavailable. */
const memoryStore = new Map<string, MemoryBucket>();

/** Purge stale entries from the in-memory store every 5 minutes. */
if (typeof globalThis !== 'undefined') {
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  // Use a module-level flag so HMR in dev doesn't register multiple intervals.
  const g = globalThis as typeof globalThis & { __rlCleanup?: boolean };
  if (!g.__rlCleanup) {
    g.__rlCleanup = true;
    setInterval(() => {
      const now = Date.now();
      memoryStore.forEach((bucket, key) => {
        if (bucket.resetAt < now) memoryStore.delete(key);
      });
    }, CLEANUP_INTERVAL_MS).unref?.();
  }
}

/**
 * Check and increment the in-memory rate limit counter.
 * Not suitable for multi-instance deployments — use Redis in production.
 */
function checkMemoryLimit(
  storeKey: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryStore.get(storeKey);

  if (!bucket || bucket.resetAt <= now) {
    // First request in this window — initialise the bucket.
    const resetAt = now + windowMs;
    memoryStore.set(storeKey, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const allowed = bucket.count <= limit;
  return { allowed, remaining, resetAt: new Date(bucket.resetAt) };
}

// ---------------------------------------------------------------------------
// Redis (Upstash REST API) implementation
// ---------------------------------------------------------------------------

/**
 * Atomic Lua script: INCR the counter and set PEXPIRE only on the first call.
 * Running as a single EVAL ensures no race window between INCR and PEXPIRE
 * across concurrent serverless instances.
 *
 * Returns an array: [count, pttl_after_set]
 */
const RATE_LIMIT_LUA = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local pttl = redis.call('PTTL', KEYS[1])
return {count, pttl}
`.trim();

/**
 * Call the Upstash Redis REST API.
 * Returns null on any network or configuration error (triggers fallback).
 */
async function callUpstash(
  command: string,
  args: string[]
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/${command}/${args.map(encodeURIComponent).join('/')}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2_000),
    });

    if (!res.ok) return null;
    const json = await res.json() as { result: unknown };
    return json.result;
  } catch {
    return null;
  }
}

/**
 * Call the Upstash Redis REST API via POST (used for EVAL with Lua body).
 */
async function callUpstashPost(
  body: unknown
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2_000),
    });

    if (!res.ok) return null;
    const json = await res.json() as { result: unknown };
    return json.result;
  } catch {
    return null;
  }
}

/**
 * Check rate limit via Upstash Redis using an atomic Lua EVAL.
 * The Lua script performs INCR + PEXPIRE (on first call only) in a single
 * round-trip, eliminating the race window between two separate pipeline calls.
 *
 * Returns null if Redis is unavailable (caller falls back to memory).
 */
async function checkRedisLimit(
  storeKey: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  // EVAL: script, numkeys, key, windowMs_as_string
  const result = await callUpstashPost(
    ['EVAL', RATE_LIMIT_LUA, '1', storeKey, String(windowMs)]
  );

  if (!Array.isArray(result) || result.length < 2) return null;

  const count = Number(result[0]);
  const pttl  = Number(result[1]);  // milliseconds remaining

  if (isNaN(count) || isNaN(pttl)) return null;

  const resetAt  = new Date(Date.now() + Math.max(pttl, 0));
  const remaining = Math.max(0, limit - count);
  const allowed   = count <= limit;

  return { allowed, remaining, resetAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check the rate limit for a given endpoint and identifier.
 *
 * Attempts Redis first.  If Redis is unavailable:
 *   - `failOpen: false` buckets return a synthetic "blocked" result so the
 *     caller can respond with 503 — prevents auth/payment routes from running
 *     unthrottled when the distributed store is down.
 *   - `failOpen: true` buckets fall back to the in-process store.
 *
 * @param key        - The rate limit configuration key (see RATE_LIMITS).
 * @param identifier - The scoping identifier: IP address, user ID, or phone number.
 * @returns RateLimitResult with `allowed`, `remaining`, and `resetAt`.
 */
export async function checkRateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[key];
  const storeKey = `plutus:rl:${key}:${identifier}`;

  // Try Redis first.
  const redisResult = await checkRedisLimit(storeKey, config.requests, config.windowMs);
  if (redisResult) return redisResult;

  // Redis unavailable.
  if (!config.failOpen) {
    // Fail closed: treat as rate-limited so the route returns 503.
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + 60_000) };
  }

  // Fallback to in-memory for non-critical routes.
  return checkMemoryLimit(storeKey, config.requests, config.windowMs);
}

/**
 * Assert rate limit — returns a 429 Response if the limit is exceeded,
 * or `null` if the request is allowed to proceed.
 *
 * Sets `Retry-After` (seconds) and `X-RateLimit-*` response headers.
 *
 * @param key        - The rate limit configuration key.
 * @param identifier - The scoping identifier (IP address, user ID, etc.).
 * @returns A 429 Response if rate-limited, `null` if allowed.
 */
export async function assertRateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<Response | null> {
  const result = await checkRateLimit(key, identifier);

  const retryAfterSecs = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit':     String(RATE_LIMITS[key].requests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.floor(result.resetAt.getTime() / 1000)),
  };

  if (!result.allowed) {
    // When Redis is unreachable and failOpen:false, remaining===0 and resetAt is
    // synthetic (1 min from now).  Use 503 to distinguish "infra down" from "you
    // sent too many requests" (429) so clients can handle them differently.
    const isRedisDown =
      result.remaining === 0 &&
      !RATE_LIMITS[key].failOpen &&
      result.resetAt.getTime() - Date.now() <= 61_000;

    const status = isRedisDown ? 503 : 429;
    const errorMsg = isRedisDown
      ? 'Rate limiting service temporarily unavailable. Please try again shortly.'
      : 'Too many requests. Please try again later.';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        retryAfter: retryAfterSecs,
      }),
      {
        status,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Retry-After':  String(retryAfterSecs),
        },
      }
    );
  }

  return null;
}

/**
 * Extract the real client IP from a request, handling common proxy headers.
 *
 * Header precedence (most trusted first):
 *   1. `cf-connecting-ip`  — Cloudflare (set only by CF, not spoofable)
 *   2. `x-real-ip`         — Nginx / Vercel
 *   3. `x-forwarded-for`   — Standard proxy chain (first IP = original client)
 *   4. Fallback: `'0.0.0.0'`
 *
 * IMPORTANT: Trust only headers set by your own infra. If not behind a trusted
 * reverse proxy, use only the connection remote address.
 *
 * @param request - The incoming HTTP Request.
 * @returns IP address string, or `'0.0.0.0'` if not determinable.
 */
export function getClientIP(request: Request): string {
  const h = (name: string) => request.headers.get(name);

  // Cloudflare sets this header at the edge — most reliable when using CF.
  const cfIp = h('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // Vercel / Nginx real IP.
  const realIp = h('x-real-ip');
  if (realIp) return realIp.trim();

  // Standard forwarded-for: "client, proxy1, proxy2" — take the first.
  const forwarded = h('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  return '0.0.0.0';
}
