import { getRedisClient } from '@/lib/infra/redis';

/**
 * Distributed rate limiting for PlutusClub API routes.
 *
 * Strategy:
 * 1. Distributed Redis (Upstash) - Primary (Atomic via Lua)
 * 2. In-memory Map (Fallback) - Single instance only
 */

const localBucket = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const redis = getRedisClient();

  // 1. Try Distributed Redis
  if (redis) {
    try {
      // Use Lua script to ensure atomicity of INCR + PEXPIRE
      const script = `
        local count = redis.call("INCR", KEYS[1])
        if count == 1 then
          redis.call("PEXPIRE", KEYS[1], ARGV[1])
        end
        return count
      `;

      const count = await redis.eval(script, 1, key, windowMs) as number;
      return count <= max;
    } catch (err) {
      console.error('[RATE-LIMIT] Redis failure, falling back to local memory:', err);
    }
  }

  // 2. Fallback to Local Memory
  const now = Date.now();
  const state = localBucket.get(key);

  if (!state || now > state.resetAt) {
    localBucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (state.count >= max) return false;
  state.count += 1;
  localBucket.set(key, state);
  return true;
}
