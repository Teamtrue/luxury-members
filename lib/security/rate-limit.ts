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

/** Per-endpoint rate limit configurations. */
export const RATE_LIMITS = {
  /** OTP send: 3 requests per minute per phone number. */
  'auth:send-otp':    { requests: 3,   windowMs: 60_000 },
  /** OTP verify: 5 attempts per 5 minutes per phone number. */
  'auth:verify-otp':  { requests: 5,   windowMs: 300_000 },
  /** Login: 10 attempts per 15 minutes per IP. */
  'auth:login':       { requests: 10,  windowMs: 900_000 },
  /** Payment creation: 5 per minute per user. */
  'payments:create':  { requests: 5,   windowMs: 60_000 },
  /** Booking creation: 10 per hour per user. */
  'bookings:create':  { requests: 10,  windowMs: 3_600_000 },
  /** General authenticated API: 100 per minute per IP. */
  'api:general':      { requests: 100, windowMs: 60_000 },
  /** Public endpoints (no auth required): 300 per minute per IP. */
  'api:public':       { requests: 300, windowMs: 60_000 },
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
 * Call the Upstash Redis REST API with a pipeline of commands.
 * Returns null on any network or configuration error (triggers fallback).
 */
async function callUpstashPipeline(
  commands: Array<[string, ...string[]]>
): Promise<Array<number | string | null> | null> {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      // Short timeout so Redis unavailability falls back to memory quickly.
      signal: AbortSignal.timeout(2_000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as Array<{ result: number | string | null }>;
    return json.map((r) => r.result);
  } catch {
    // Network error / timeout — degrade gracefully to in-memory.
    return null;
  }
}

/**
 * Check rate limit via Upstash Redis using INCR + EXPIRE pipeline.
 * Returns null if Redis is unavailable (caller falls back to memory).
 */
async function checkRedisLimit(
  storeKey: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const windowSecs = Math.ceil(windowMs / 1000);

  // Pipeline: INCR key → TTL key → (conditionally) EXPIRE key if TTL === -1
  const results = await callUpstashPipeline([
    ['INCR', storeKey],
    ['TTL', storeKey],
  ]);

  if (!results) return null;

  const [incrResult, ttlResult] = results;
  const count = typeof incrResult === 'number' ? incrResult : parseInt(String(incrResult), 10);
  const ttl   = typeof ttlResult  === 'number' ? ttlResult  : parseInt(String(ttlResult),  10);

  // If this is the first increment (count === 1) or key has no expiry, set EXPIRE.
  if (count === 1 || ttl === -1) {
    await callUpstashPipeline([['EXPIRE', storeKey, String(windowSecs)]]);
  }

  const currentTtl = count === 1 ? windowSecs : Math.max(ttl, 0);
  const resetAt = new Date(Date.now() + currentTtl * 1000);
  const remaining = Math.max(0, limit - count);
  const allowed = count <= limit;

  return { allowed, remaining, resetAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check the rate limit for a given endpoint and identifier.
 * Attempts Redis first; falls back to in-memory if Redis is unavailable.
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

  // Fallback to in-memory.
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
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSecs,
      }),
      {
        status: 429,
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
