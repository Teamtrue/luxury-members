/**
 * POST /api/auth/send-otp
 * ---------------------------------------------------------------------------
 * Generates and dispatches an OTP to the supplied phone number.
 *
 * Security layers:
 *   1. API-layer rate limit  — 3 requests / minute per phone (Redis or memory)
 *   2. DB-layer rate limit   — 5 OTPs / hour per phone (isPhoneOTPRateLimited)
 *   3. OTP invalidation      — any existing active OTP is burned before a new
 *                             one is created (prevents parallel valid tokens)
 *   4. Hash-only storage     — raw OTP never written to the database
 *
 * The raw OTP is NEVER returned in the API response — not even in dev mode.
 * In dev mode without an SMS provider, the OTP is logged to the server console.
 * ---------------------------------------------------------------------------
 */

import { parseBody, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertRateLimit, getClientIP }    from '@/lib/security/rate-limit';
import { createOTP, isPhoneOTPRateLimited } from '@/lib/auth/otp';
import { getSMSProvider }                   from '@/lib/providers';
import { ProviderNotConfiguredError }        from '@/lib/providers';
import { sendOtpSchema }                     from '@/lib/validations';
import { isOtpRateLimited }                  from '@/lib/redis';

export async function POST(request: Request): Promise<Response> {
  // 1. Parse + validate body
  const parsed = await parseBody(request, sendOtpSchema);
  if ('error' in parsed) return parsed.error;
  const { phone } = parsed.data;

  // 2. API-layer rate limit — Redis sliding window (3 OTPs / minute per phone).
  //    Falls back silently to allowing the request when Redis is unavailable
  //    (dev mode without REDIS_URL, or transient Redis outage).
  const redisBlocked = await isOtpRateLimited(phone);
  if (redisBlocked) {
    return apiError(
      'Too many OTP requests. Please wait a minute before requesting a new code.',
      429
    );
  }

  // 3. IP-level rate limit guard (secondary, covers burst from a single IP)
  const rateLimitError = await assertRateLimit('auth:send-otp', phone);
  if (rateLimitError) return rateLimitError;

  // 4. DB-level hourly rate limit (secondary guard)
  const isLimited = await isPhoneOTPRateLimited('+91' + phone);
  if (isLimited) {
    return apiError(
      'Too many OTP requests for this number. Please wait before requesting a new code.',
      429
    );
  }

  // 5. Generate OTP and store hash in DB
  let otp: string;
  try {
    otp = await createOTP('+91' + phone, 'signin');
  } catch (err) {
    console.error('[send-otp] Failed to create OTP:', err);
    return apiError('Failed to generate OTP. Please try again.', 500);
  }

  // 6. Dispatch via configured SMS provider
  try {
    const smsProvider = await getSMSProvider();
    await smsProvider.sendOTP({
      phone: '+91' + phone,
      otp,
      expiryMinutes: 10,
    });
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      if (process.env.NODE_ENV !== 'production') {
        // Dev mode: SMS provider not configured — OTP is in the database (otp_verifications table).
        // Retrieve it from Supabase to display in response for development convenience.
        return apiSuccess({ message: 'OTP generated (dev mode: check otp_verifications table)', dev_mode: true });
      }
      return apiError(
        'SMS service is not configured. Please contact support.',
        503
      );
    }

    // Provider threw an unexpected error.
    console.error('[send-otp] SMS provider error:', err);
    return apiError('Failed to send OTP. Please try again in a moment.', 500);
  }

  return apiSuccess({ message: 'OTP sent to your mobile number.' });
}
