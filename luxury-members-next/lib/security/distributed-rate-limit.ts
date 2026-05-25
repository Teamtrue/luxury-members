const localBucket = new Map<string, { count: number; resetAt: number }>();

export async function checkDistributedRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  // Placeholder for Redis-backed implementation. Fallback to local memory.
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
