/**
 * POST /api/admin/mfa/verify-setup
 * ---------------------------------------------------------------------------
 * Confirms a TOTP setup by verifying the first code the admin enters after
 * scanning the QR code. On success:
 *   1. Sets totp_enabled = true.
 *   2. Generates 8 single-use backup codes (SHA-256 hashed in DB).
 *   3. Returns the raw backup codes once (never again).
 * ---------------------------------------------------------------------------
 */

import { z }                                   from 'zod';
import { requireAdmin, apiSuccess, apiError }   from '@/lib/api-helpers';
import { assertCsrf }                           from '@/lib/security/csrf';
import { createServiceRoleClient }              from '@/lib/supabase/service';
import { verifyTotp }                           from '@/lib/auth/totp';
import { decrypt }                              from '@/lib/security/encrypt';
import { logAudit }                             from '@/lib/audit';
import { getClientIP }                          from '@/lib/security/rate-limit';
import crypto                                   from 'crypto';

const schema = z.object({
  code: z.string().length(6, 'TOTP code must be 6 digits.').regex(/^\d+$/, 'TOTP code must be numeric.'),
});

function hashBackupCode(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomInt(10_000_000, 99_999_999).toString()
  );
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const csrfError = assertCsrf(request, session.adminUserId);
  if (csrfError) return csrfError;

  let body: unknown;
  try { body = await request.json(); } catch { return apiError('Invalid JSON.', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Validation failed.', 400);

  const { code } = parsed.data;

  const db = createServiceRoleClient();

  const { data: adminUser } = await db
    .from('admin_users')
    .select('totp_enabled, totp_secret_encrypted')
    .eq('id', session.adminUserId)
    .single();

  if (!adminUser) return apiError('Admin user not found.', 404);

  const u = adminUser as { totp_enabled: boolean; totp_secret_encrypted: string | null };

  if (u.totp_enabled) return apiError('MFA is already enabled.', 409);
  if (!u.totp_secret_encrypted) return apiError('No pending TOTP setup. Call /api/admin/mfa/setup first.', 400);

  let secret: string;
  try {
    secret = decrypt(u.totp_secret_encrypted);
  } catch {
    return apiError('Failed to read pending TOTP secret. Please restart setup.', 500);
  }

  if (!verifyTotp(secret, code)) {
    return apiError('Invalid TOTP code. Please check your authenticator app and try again.', 401);
  }

  // Generate backup codes
  const rawCodes   = generateBackupCodes(8);
  const hashedCodes = rawCodes.map(hashBackupCode);

  // Enable MFA
  const { error: updateError } = await db
    .from('admin_users')
    .update({
      totp_enabled:      true,
      totp_backup_codes: hashedCodes,
    })
    .eq('id', session.adminUserId);

  if (updateError) {
    console.error('[mfa/verify-setup] DB update failed:', updateError.message);
    return apiError('Failed to enable MFA. Please try again.', 500);
  }

  await logAudit({
    action:     'admin.mfa.enabled',
    actor_type: 'admin',
    actor_id:   session.adminUserId,
    details:    {},
    ip_address: getClientIP(request),
  });

  return apiSuccess({
    backup_codes: rawCodes,
    message: 'MFA enabled. Save your backup codes — they will not be shown again.',
  });
}
