const bucket = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const state = bucket.get(key);

  if (!state || now > state.resetAt) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (state.count >= max) return false;
  state.count += 1;
  bucket.set(key, state);
  return true;
}
