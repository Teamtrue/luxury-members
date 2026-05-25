const requiredInProd = [
  'JWT_SECRET',
  'DATABASE_URL',
  'PAYMENT_WEBHOOK_SECRET',
  'INTERNAL_JOB_TOKEN',
  'OTP_SIGNING_SECRET',
  'EMAIL_TOKEN_SECRET'
] as const;

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = requiredInProd.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required production secrets: ${missing.join(', ')}`);
  }
}
