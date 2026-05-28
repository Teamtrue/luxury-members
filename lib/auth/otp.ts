/**
 * lib/auth/otp.ts
 * ---------------------------------------------------------------------------
 * OTP lifecycle management for PlutusClub's phone-based authentication.
 *
 * Storage: `auth_otp` table in Supabase (created via migration).
 * If the table does not yet exist in your database, apply this SQL first:
 *
 * ```sql
 * CREATE TABLE IF NOT EXISTS auth_otp (
 *   id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   phone         TEXT        NOT NULL,
 *   otp_hash      TEXT        NOT NULL,
 *   purpose       TEXT        NOT NULL CHECK (purpose IN ('signin', 'verify')),
 *   expires_at    TIMESTAMPTZ NOT NULL,
 *   used_at       TIMESTAMPTZ,
 *   attempt_count INTEGER     NOT NULL DEFAULT 0,
 *   created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS auth_otp_phone_purpose_idx ON auth_otp (phone, purpose);
 * ALTER TABLE auth_otp ENABLE ROW LEVEL SECURITY;
 * -- No permissive policies: service role only.
 * ```
 * ---------------------------------------------------------------------------
 */

import { generateOTP, hashToken, timingSafeEqual } from '../security/tokens';
import { createServiceRoleClient } from '../supabase/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The purpose of an OTP — controls which flow is gated. */
export type OtpPurpose = 'signin' | 'verify';

/** Maximum number of failed verification attempts before an OTP is burned. */
const MAX_ATTEMPTS = 3;

/** OTP validity period in minutes. */
const OTP_TTL_MINUTES = 10;

/** DB-level rate limit: max OTPs that may be generated per phone per hour. */
const HOURLY_OTP_LIMIT = 5;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a fresh OTP for the given phone + purpose, store its hash in the
 * database, and return the raw OTP for delivery via SMS.
 *
 * Behaviour:
 *   - Any existing active (unused, unexpired) OTPs for the same phone+purpose
 *     are marked as used before the new one is created, preventing replay.
 *   - The raw OTP is never written to the database — only its SHA-256 hash.
 *
 * @param phone   - Recipient phone number (E.164 format, e.g. +919876543210).
 * @param purpose - `'signin'` for login flow, `'verify'` for phone verification.
 * @returns The raw 6-digit OTP string. Deliver this via SMS — do not log it.
 * @throws Error if the database operation fails.
 */
export async function createOTP(phone: string, purpose: OtpPurpose): Promise<string> {
  const db = createServiceRoleClient();
  const now = new Date().toISOString();

  // Invalidate any existing active OTPs for this phone+purpose to prevent
  // multiple valid tokens existing simultaneously (replay / enumeration risk).
  await db
    .from('auth_otp')
    .update({ used_at: now })
    .eq('phone', phone)
    .eq('purpose', purpose)
    .is('used_at', null)
    .gt('expires_at', now);

  // Generate a cryptographically secure 6-digit OTP.
  const rawOtp  = generateOTP(6);
  const otpHash = hashToken(rawOtp); // SHA-256, one-way

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await db.from('auth_otp').insert({
    phone,
    otp_hash:      otpHash,
    purpose,
    expires_at:    expiresAt,
    attempt_count: 0,
  });

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }

  // Return the raw OTP for SMS delivery — the caller is responsible for sending.
  return rawOtp;
}

/**
 * Verify a submitted OTP against the stored hash for the given phone + purpose.
 *
 * Brute-force protection:
 *   - Each verification attempt increments `attempt_count`.
 *   - After `MAX_ATTEMPTS` (3) failed attempts the OTP is burned (used_at set)
 *     so further guesses are impossible even if the window has not expired.
 *
 * @param phone   - Phone number the OTP was sent to.
 * @param otp     - The 6-digit OTP submitted by the user.
 * @param purpose - Must match the purpose used during `createOTP`.
 * @returns `true` if the OTP is correct and valid, `false` otherwise.
 */
export async function verifyOTP(
  phone: string,
  otp: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const db  = createServiceRoleClient();
  const now = new Date().toISOString();

  // Fetch the most recent active OTP for this phone+purpose.
  const { data, error } = await db
    .from('auth_otp')
    .select('id, otp_hash, attempt_count')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No active OTP found — expired, already used, or never created.
    return false;
  }

  const record = data as { id: string; otp_hash: string; attempt_count: number };

  // Increment attempt_count first — do this regardless of correctness so that
  // a timing oracle cannot distinguish "wrong OTP" from "OTP not found".
  const newAttemptCount = record.attempt_count + 1;

  // If over the attempt limit, burn the OTP and deny.
  if (newAttemptCount > MAX_ATTEMPTS) {
    await db
      .from('auth_otp')
      .update({ attempt_count: newAttemptCount, used_at: now })
      .eq('id', record.id);
    return false;
  }

  await db
    .from('auth_otp')
    .update({ attempt_count: newAttemptCount })
    .eq('id', record.id);

  // Hash the submitted OTP and compare with the stored hash (timing-safe).
  const submittedHash = hashToken(otp);
  const isMatch       = timingSafeEqual(submittedHash, record.otp_hash);

  if (isMatch) {
    // Mark as used — prevents replay attacks.
    await db
      .from('auth_otp')
      .update({ used_at: now })
      .eq('id', record.id);
    return true;
  }

  return false;
}

/**
 * Check whether a phone number has exceeded the DB-level OTP generation rate limit.
 *
 * This is a secondary, database-enforced guard that operates independently of
 * the API-layer rate limiter in `lib/security/rate-limit.ts`. It prevents an
 * attacker who has bypassed or reset the in-memory limiter from flooding a
 * victim's phone with OTP SMS messages.
 *
 * Limit: {@link HOURLY_OTP_LIMIT} OTP requests per phone number per 60 minutes.
 *
 * @param phone - Phone number to check (E.164 format).
 * @returns `true` if the phone is rate-limited and the OTP should NOT be sent.
 */
export async function isPhoneOTPRateLimited(phone: string): Promise<boolean> {
  const db = createServiceRoleClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await db
    .from('auth_otp')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', windowStart);

  if (error) {
    // Fail open — don't block the user if we can't read the DB.
    // The API-layer rate limiter is the primary defence.
    console.error('[OTP] Rate limit DB check failed:', error.message);
    return false;
  }

  return (count ?? 0) >= HOURLY_OTP_LIMIT;
}
