/**
 * lib/security/env-guard.ts
 * ---------------------------------------------------------------------------
 * Production startup guard — fails fast if required secrets are missing.
 *
 * Call `assertProductionSecrets()` at the top of any module that handles
 * auth, payments, or admin operations.  In production the server will refuse
 * to start rather than silently run with insecure defaults.
 *
 * In development (NODE_ENV !== 'production') the check is skipped so
 * engineers can run the app without a full .env file.
 * ---------------------------------------------------------------------------
 */

const REQUIRED_PRODUCTION_SECRETS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'APP_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

type RequiredSecret = (typeof REQUIRED_PRODUCTION_SECRETS)[number];

/**
 * Return the value of a required secret or throw if missing/empty.
 * Always throws (in any environment) — use for values that have no safe default.
 */
export function getRequiredSecret(key: RequiredSecret): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required secret: ${key}. Set this environment variable before starting the server.`);
  }
  return value;
}

/**
 * Assert all required production secrets are present.
 * No-ops in non-production environments.
 * Throws with a list of ALL missing secrets (not just the first).
 */
export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = REQUIRED_PRODUCTION_SECRETS.filter(
    (k) => !process.env[k] || process.env[k]!.trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `Server startup aborted — missing required production secrets:\n  ${missing.join('\n  ')}\n\nSet all required environment variables before deploying.`
    );
  }
}

/**
 * Assert a minimum entropy length for a secret (32 chars = 256-bit for hex).
 * Prevents accidentally deploying with short/weak secrets.
 */
export function assertSecretStrength(key: string, value: string, minLength = 32): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (value.length < minLength) {
    throw new Error(
      `Secret ${key} is too short (${value.length} chars). Minimum is ${minLength} characters for production.`
    );
  }
}
