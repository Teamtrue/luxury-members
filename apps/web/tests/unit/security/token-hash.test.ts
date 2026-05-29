import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashToken, safeEqualHash } from '@/lib/security/token-hash';

const originalOtpSecret = process.env.OTP_SIGNING_SECRET;
const originalEmailSecret = process.env.EMAIL_TOKEN_SECRET;

beforeEach(() => {
  process.env.OTP_SIGNING_SECRET = 'test_otp_secret_at_least_32_chars__';
  process.env.EMAIL_TOKEN_SECRET = 'test_email_secret_at_least_32_chars';
});

afterEach(() => {
  process.env.OTP_SIGNING_SECRET = originalOtpSecret;
  process.env.EMAIL_TOKEN_SECRET = originalEmailSecret;
});

describe('token-hash', () => {
  it('hashes deterministically per namespace', () => {
    expect(hashToken('abc', 'otp')).toBe(hashToken('abc', 'otp'));
    expect(hashToken('abc', 'email_verify')).toBe(hashToken('abc', 'email_verify'));
  });

  it('produces different hashes for different namespaces', () => {
    expect(hashToken('abc', 'otp')).not.toBe(hashToken('abc', 'email_verify'));
  });

  it('safeEqualHash detects equal hashes', () => {
    const a = hashToken('abc', 'otp');
    const b = hashToken('abc', 'otp');
    expect(safeEqualHash(a, b)).toBe(true);
  });

  it('safeEqualHash detects different hashes', () => {
    const a = hashToken('abc', 'otp');
    const c = hashToken('def', 'otp');
    expect(safeEqualHash(a, c)).toBe(false);
  });
});
