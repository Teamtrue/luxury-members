/**
 * Simplified distributed rate limit check — in-memory fallback suitable for
 * single-instance dev/test. Production uses the Redis-backed checkRateLimit
 * from rate-limit.ts.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

/**
 * Check and increment a rate-limit counter.
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export function checkDistributedRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
