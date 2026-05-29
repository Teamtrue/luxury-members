/**
 * lib/redis.ts
 * ---------------------------------------------------------------------------
 * ioredis client singleton for PlutusClub server-side use.
 *
 * Returns null gracefully when REDIS_URL is not set (dev / mock mode) so
 * callers can degrade without throwing.  The client is lazily connected and
 * re-used across warm serverless invocations via module-level caching.
 *
 * Usage:
 *   const redis = getRedis();
 *   if (!redis) { /* fall back to in-memory or skip *\/ }
 *   await redis.incr('mykey');
 *
 * NOTE: For API-layer rate limiting, prefer the distributed implementation in
 * lib/security/rate-limit.ts which uses the Upstash REST API (no persistent
 * TCP connection required in serverless environments).  This module is
 * intended for longer-lived background jobs, cron workers, and features that
 * benefit from native ioredis commands (pipelines, Lua scripts, pub/sub).
 * ---------------------------------------------------------------------------
 */

import Redis from 'ioredis';

// Module-level singleton — shared across warm Lambda/serverless invocations.
let client: Redis | null = null;

/**
 * Return the shared ioredis client, or null if REDIS_URL is not configured.
 *
 * Graceful degradation contract:
 *   - If REDIS_URL is absent (dev mode / CI), returns null immediately.
 *   - If the connection drops, ioredis retries automatically; errors are
 *     surfaced via the 'error' event (logged, never thrown to the caller).
 *   - Callers MUST handle the null case — never block requests when Redis
 *     is unavailable.
 *
 * @returns A connected (or connecting) Redis instance, or null.
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Keep alive to reduce reconnect overhead on repeated cron invocations.
      keepAlive: 10_000,
    });

    client.on('error', (err: Error) => {
      console.error('[redis] connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('[redis] connected');
    });
  }

  return client;
}

/**
 * Sliding-window OTP rate limit using ioredis INCR + EXPIRE.
 *
 * Increments the counter for the given phone number within a 60-second window.
 * Returns true if the request should be blocked (limit exceeded), false if allowed.
 * Falls back to allowing the request (returns false) when Redis is unavailable.
 *
 * @param phone      - The E.164 or local phone number used as the rate-limit key.
 * @param maxPerMin  - Maximum allowed OTP requests per 60-second window (default: 3).
 * @returns true = blocked, false = allowed.
 */
export async function isOtpRateLimited(
  phone: string,
  maxPerMin = 3
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // graceful degradation — never block in dev/mock mode

  const key = `otp:rate:${phone}`;

  try {
    const count = await redis.incr(key);

    // On the first increment, set a 60-second window.
    if (count === 1) {
      await redis.expire(key, 60);
    }

    return count > maxPerMin;
  } catch (err) {
    // Redis unavailable — allow the request rather than blocking legitimate users.
    console.error('[redis] isOtpRateLimited error:', (err as Error).message);
    return false;
  }
}
