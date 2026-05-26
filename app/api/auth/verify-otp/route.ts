/**
 * POST /api/auth/verify-otp
 * ---------------------------------------------------------------------------
 * Verifies a submitted OTP and, on success, establishes a Supabase Auth
 * session that the client can use for all subsequent authenticated requests.
 *
 * Flow:
 *   1. Validate request body (phone + otp).
 *   2. Rate-limit by phone number.
 *   3. Verify OTP via verifyOTP() (checks DB hash, enforces 3-attempt limit).
 *   4. Look up or create the auth.users record for this phone via service role.
 *   5. Generate a magic-link / token that lets the client sign in directly.
 *   6. Return { access_token, refresh_token, user } so the client can call
 *      supabase.auth.setSession({ access_token, refresh_token }).
 *
 * Why custom OTP rather than Supabase native SMS OTP?
 *   PlutusClub uses a pluggable SMS provider system (MSG91, Twilio, etc.) that
 *   is admin-configurable at runtime. Supabase native SMS OTP is hardwired to
 *   Twilio/MessageBird and cannot be swapped without code changes.
 * ---------------------------------------------------------------------------
 */

import { parseBody, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertRateLimit, getClientIP }    from '@/lib/security/rate-limit';
import { verifyOTP }                        from '@/lib/auth/otp';
import { createServiceRoleClient }          from '@/lib/supabase/service';
import { verifyOtpSchema }                  from '@/lib/validations';
import { logAudit }                         from '@/lib/audit';

export async function POST(request: Request): Promise<Response> {
  // 1. Parse + validate
  const parsed = await parseBody(request, verifyOtpSchema);
  if ('error' in parsed) return parsed.error;
  const { phone, otp } = parsed.data;

  const e164Phone = '+91' + phone;

  // 2. Rate limit (by phone number)
  const rateLimitError = await assertRateLimit('auth:verify-otp', phone);
  if (rateLimitError) return rateLimitError;

  // 3. Verify OTP against stored hash
  const isValid = await verifyOTP(e164Phone, otp, 'signin');
  if (!isValid) {
    return apiError('Invalid or expired OTP. Please request a new one.', 401);
  }

  // 4. Find or create the Supabase auth user for this phone number.
  const db = createServiceRoleClient();

  // Look up existing auth user by phone using the admin API.
  let userId: string;

  try {
    // Supabase stores phone in E.164 format.
    const { data: listData, error: listError } = await db.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });

    if (listError) {
      console.error('[verify-otp] Failed to list users:', listError.message);
      return apiError('Authentication service error. Please try again.', 500);
    }

    // Find by phone in the returned list.
    // Note: listUsers doesn't support server-side filter by phone; we query
    // user_profiles table which is more efficient for phone lookups.
    const { data: profile, error: profileError } = await db
      .from('user_profiles')
      .select('id')
      .eq('phone', e164Phone)
      .maybeSingle();

    if (profileError) {
      console.error('[verify-otp] Profile lookup error:', profileError.message);
      return apiError('Authentication service error. Please try again.', 500);
    }

    if (profile) {
      userId = profile.id as string;
    } else {
      // New user — create auth record + profile.
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        phone: e164Phone,
        phone_confirm: true,
        user_metadata: { role: 'member' },
      });

      if (createError || !newUser.user) {
        console.error('[verify-otp] Failed to create user:', createError?.message);
        return apiError('Failed to create account. Please try again.', 500);
      }

      userId = newUser.user.id;

      // Create user_profile row (phone is verified since we just sent the OTP).
      const { error: profileInsertError } = await db.from('user_profiles').insert({
        id:             userId,
        phone:          e164Phone,
        phone_verified: true,
      });

      if (profileInsertError) {
        // Non-fatal — profile can be created lazily; log and continue.
        console.error('[verify-otp] Profile insert failed:', profileInsertError.message);
      }
    }
  } catch (err) {
    console.error('[verify-otp] Unexpected error during user lookup:', err);
    return apiError('Authentication service error. Please try again.', 500);
  }

  // 5. Generate a short-lived sign-in link so the client can obtain a real session.
  //    We use generateLink with type 'magiclink' and then extract the tokens from it,
  //    OR use the simpler approach of createSession (available in Supabase >= 2.x).
  try {
    const { data: sessionData, error: sessionError } =
      await db.auth.admin.createSession({ user_id: userId });

    if (sessionError || !sessionData.session) {
      console.error('[verify-otp] Session creation failed:', sessionError?.message);
      return apiError('Failed to create session. Please try again.', 500);
    }

    const { access_token, refresh_token } = sessionData.session;
    const ip = getClientIP(request);

    // 6. Audit
    await logAudit({
      action:      'member.created',
      actor_type:  'member',
      actor_id:    userId,
      target_type: 'member',
      target_id:   userId,
      details:     { phone: e164Phone.replace(/\d{6}$/, '******'), event: 'signin' },
      ip_address:  ip,
      user_agent:  request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({
      access_token,
      refresh_token,
      user: {
        id:    userId,
        phone: e164Phone,
        role:  'member',
      },
    });
  } catch (err) {
    console.error('[verify-otp] Session creation threw:', err);
    return apiError('Failed to create session. Please try again.', 500);
  }
}
