const REQUIRED = [
  'JWT_SECRET',
  'DATABASE_URL',
  'PAYMENT_WEBHOOK_SECRET',
  'PAYMENT_SIGNING_SECRET',
  'INTERNAL_JOB_TOKEN',
  'OTP_SIGNING_SECRET',
  'EMAIL_TOKEN_SECRET'
] as const;

type RequiredKey = (typeof REQUIRED)[number];

export function getSecret(key: RequiredKey): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
}

export function assertAllRequiredSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;
  for (const key of REQUIRED) getSecret(key);
}
