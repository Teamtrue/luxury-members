import { createHmac, timingSafeEqual } from 'crypto';

function secretFor(namespace: 'otp' | 'email_verify'): string {
  if (namespace === 'otp') {
    return process.env.OTP_SIGNING_SECRET || 'dev-otp-secret';
  }
  return process.env.EMAIL_TOKEN_SECRET || process.env.OTP_SIGNING_SECRET || 'dev-email-secret';
}

export function hashToken(value: string, namespace: 'otp' | 'email_verify'): string {
  return createHmac('sha256', secretFor(namespace)).update(value).digest('hex');
}

export function safeEqualHash(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
