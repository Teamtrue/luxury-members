import { getRedisClient } from '@/lib/infra/redis';

const localBucket = new Map<string, { count: number; resetAt: number }>();

export async function checkDistributedRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }
      return count <= max;
    } catch {
      // fall through to local fallback
    }
  }

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
