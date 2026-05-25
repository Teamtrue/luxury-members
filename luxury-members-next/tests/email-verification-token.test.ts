import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

describe('email verification token hash', () => {
  it('is deterministic for same token', () => {
    const token = 'sample-token-value';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('changes for different token', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});
