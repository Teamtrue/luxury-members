/**
 * lib/auth/totp.ts
 * ---------------------------------------------------------------------------
 * RFC 6238 TOTP / RFC 4226 HOTP implementation using only Node.js crypto.
 * No third-party dependencies.
 *
 * Algorithm:
 *   HOTP(K, C) = Truncate(HMAC-SHA1(K, C))
 *   TOTP(K)    = HOTP(K, floor(unixTime / STEP))
 * ---------------------------------------------------------------------------
 */

import crypto from 'crypto';

const STEP_SECONDS  = 30;   // one TOTP period
const DIGITS        = 6;    // output digits
const WINDOW        = 1;    // ±1 step for clock drift tolerance

// ---------------------------------------------------------------------------
// Base32 helpers
// ---------------------------------------------------------------------------

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]!;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 31];
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const str = input.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of str) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

// ---------------------------------------------------------------------------
// HOTP
// ---------------------------------------------------------------------------

function hotp(secretBuf: Buffer, counter: number): string {
  // Counter as 8-byte big-endian
  const counterBuf = Buffer.alloc(8);
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  counterBuf.writeUInt32BE(hi, 0);
  counterBuf.writeUInt32BE(lo, 4);

  const hmac = crypto.createHmac('sha1', secretBuf).update(counterBuf).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8)  |
     (hmac[offset + 3]! & 0xff);

  return (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, '0');
}

// ---------------------------------------------------------------------------
// TOTP
// ---------------------------------------------------------------------------

/**
 * Generate a TOTP secret (160 bits / 20 bytes, base32-encoded).
 */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Generate the current TOTP code for a given base32 secret.
 */
export function generateTotp(secret: string, at = Date.now()): string {
  const secretBuf = base32Decode(secret);
  const counter   = Math.floor(at / 1000 / STEP_SECONDS);
  return hotp(secretBuf, counter);
}

/**
 * Verify a TOTP code with ±WINDOW step tolerance for clock drift.
 *
 * @returns true if the code matches any allowed time window
 */
export function verifyTotp(secret: string, code: string, at = Date.now()): boolean {
  const secretBuf = base32Decode(secret);
  const counter   = Math.floor(at / 1000 / STEP_SECONDS);

  for (let delta = -WINDOW; delta <= WINDOW; delta++) {
    const expected = hotp(secretBuf, counter + delta);
    if (timingSafeCompare(expected, code)) return true;
  }
  return false;
}

/**
 * Build an otpauth:// URI for use with any TOTP app (Google Authenticator, Authy, etc.).
 */
export function buildOtpAuthUri(params: {
  secret:  string;
  account: string;
  issuer:  string;
}): string {
  const { secret, account, issuer } = params;
  const encoded = encodeURIComponent;
  return `otpauth://totp/${encoded(issuer)}:${encoded(account)}?secret=${secret}&issuer=${encoded(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
