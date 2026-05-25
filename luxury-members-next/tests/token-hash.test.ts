import { describe, expect, it } from 'vitest';
import { hashToken, safeEqualHash } from '../lib/security/token-hash';

describe('token-hash', () => {
  it('hashes deterministically per namespace', () => {
    expect(hashToken('abc', 'otp')).toBe(hashToken('abc', 'otp'));
    expect(hashToken('abc', 'email_verify')).toBe(hashToken('abc', 'email_verify'));
  });

  it('safeEqualHash checks equality correctly', () => {
    const a = hashToken('abc', 'otp');
    const b = hashToken('abc', 'otp');
    const c = hashToken('def', 'otp');
    expect(safeEqualHash(a, b)).toBe(true);
    expect(safeEqualHash(a, c)).toBe(false);
  });
});
