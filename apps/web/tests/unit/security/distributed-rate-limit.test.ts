import { describe, expect, it } from 'vitest';
import { checkDistributedRateLimit } from '@/lib/security/distributed-rate-limit';

describe('checkDistributedRateLimit', () => {
  it('allows up to max count then blocks', () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    expect(checkDistributedRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkDistributedRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkDistributedRateLimit(key, 2, 60_000)).toBe(false);
  });

  it('allows fresh keys independently', () => {
    const key1 = `test:a:${Date.now()}`;
    const key2 = `test:b:${Date.now()}`;
    expect(checkDistributedRateLimit(key1, 1, 60_000)).toBe(true);
    expect(checkDistributedRateLimit(key2, 1, 60_000)).toBe(true);
  });
});
