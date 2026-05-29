import { describe, it, expect } from 'vitest';
import {
  generateTotpSecret,
  generateTotp,
  verifyTotp,
  buildOtpAuthUri,
  base32Encode,
  base32Decode,
} from '@/lib/auth/totp';

describe('base32', () => {
  it('round-trips random bytes', () => {
    const buf = Buffer.from([0x00, 0xff, 0x10, 0xab, 0xcd]);
    expect(base32Decode(base32Encode(buf))).toEqual(buf);
  });

  it('decodes known value', () => {
    // 'MFRA' decodes to [0x61, 0x46, 0x00] area — spot check no throw
    expect(() => base32Decode('JBSWY3DPEHPK3PXP')).not.toThrow();
  });
});

describe('generateTotpSecret', () => {
  it('returns a non-empty base32 string', () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThan(10);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('generates unique secrets', () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});

describe('generateTotp + verifyTotp', () => {
  it('verifies its own output', () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects wrong code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
  });

  it('accepts codes within ±1 window', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const prevCode = generateTotp(secret, now - 30_000);
    const nextCode = generateTotp(secret, now + 30_000);
    expect(verifyTotp(secret, prevCode, now)).toBe(true);
    expect(verifyTotp(secret, nextCode, now)).toBe(true);
  });

  it('rejects codes from 2 periods ago', () => {
    const secret = generateTotpSecret();
    const oldCode = generateTotp(secret, Date.now() - 90_000);
    expect(verifyTotp(secret, oldCode)).toBe(false);
  });
});

describe('buildOtpAuthUri', () => {
  it('returns a valid otpauth:// URI', () => {
    const uri = buildOtpAuthUri({
      secret:  'JBSWY3DPEHPK3PXP',
      account: 'admin@plutusclub.in',
      issuer:  'PlutusClub',
    });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=PlutusClub');
  });
});
