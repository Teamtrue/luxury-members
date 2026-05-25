import { describe, expect, it } from 'vitest';
import { checkDistributedRateLimit } from '../lib/security/distributed-rate-limit';

describe('checkDistributedRateLimit', () => {
  it('allows up to max count', async () => {
    const key = `test:${Date.now()}`;
    expect(await checkDistributedRateLimit(key, 2, 1000)).toBe(true);
    expect(await checkDistributedRateLimit(key, 2, 1000)).toBe(true);
    expect(await checkDistributedRateLimit(key, 2, 1000)).toBe(false);
  });
});
