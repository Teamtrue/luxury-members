import { createHmac as nodeCreateHmac, timingSafeEqual as nodeTimingSafeEqual } from 'crypto';

function secretFor(namespace: 'otp' | 'email_verify'): string {
  const key = namespace === 'otp' ? 'OTP_SIGNING_SECRET' : 'EMAIL_TOKEN_SECRET';
  const secret = process.env[key];
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${key} env var is required for token hashing`);
    }
    return `dev-${namespace}-fallback-not-for-production-32ch`;
  }
  return secret;
}

/** Deterministic HMAC-SHA256 hash of a token value scoped to a namespace. */
export function hashToken(value: string, namespace: 'otp' | 'email_verify'): string {
  return nodeCreateHmac('sha256', secretFor(namespace)).update(value).digest('hex');
}

/** Timing-safe comparison of two hex-encoded token hashes. */
export function safeEqualHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return nodeTimingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
