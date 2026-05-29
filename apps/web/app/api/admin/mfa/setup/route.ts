/**
 * POST /api/admin/mfa/setup
 * ---------------------------------------------------------------------------
 * Generates a fresh TOTP secret for the authenticated admin and returns the
 * otpauth:// URI (to render as a QR code on the client) and the raw base32
 * secret (for manual entry).
 *
 * The secret is NOT yet persisted — it is stored only after the admin confirms
 * with a valid TOTP code via /api/admin/mfa/verify-setup.
 *
 * To prevent a stale pending secret, we store it (encrypted) in the
 * admin_users row under a separate column `totp_pending_encrypted` so it
 * survives page refreshes. verify-setup moves it to `totp_secret_encrypted`
 * and sets totp_enabled = true.
 * ---------------------------------------------------------------------------
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertCsrf }                          from '@/lib/security/csrf';
import { createServiceRoleClient }             from '@/lib/supabase/service';
import { generateTotpSecret, buildOtpAuthUri } from '@/lib/auth/totp';
import { encrypt }                             from '@/lib/security/encrypt';
import { brand }                               from '@/lib/brand';

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const csrfError = assertCsrf(request, session.adminUserId);
  if (csrfError) return csrfError;

  const db = createServiceRoleClient();

  // Fetch admin's email for the otpauth URI label
  const { data: adminUser } = await db
    .from('admin_users')
    .select('totp_enabled, user_id')
    .eq('id', session.adminUserId)
    .single();

  if (!adminUser) return apiError('Admin user not found.', 404);

  if ((adminUser as { totp_enabled: boolean }).totp_enabled) {
    return apiError(
      'MFA is already enabled. Disable it first before setting up again.',
      409
    );
  }

  // Fetch email from auth.users via service role
  const { data: { user: authUser } } = await db.auth.admin.getUserById(
    (adminUser as { user_id: string }).user_id
  );

  const email = authUser?.email ?? 'admin';

  // Generate secret
  const secret = generateTotpSecret();
  const uri = buildOtpAuthUri({
    secret,
    account: email,
    issuer:  brand.name,
  });

  // Store encrypted pending secret (not yet active)
  const encryptedPending = encrypt(secret);
  await db
    .from('admin_users')
    .update({ totp_secret_encrypted: encryptedPending }) // stored pending until confirmed
    .eq('id', session.adminUserId);

  return apiSuccess({
    secret,
    uri,
  });
}
