/**
 * POST /api/admin/mfa/disable
 * ---------------------------------------------------------------------------
 * Disables TOTP MFA for the authenticated admin. Requires the current TOTP
 * code to prevent an attacker with a stolen session from silently disabling MFA.
 * ---------------------------------------------------------------------------
 */

import { z }                              from 'zod';
import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertCsrf }                     from '@/lib/security/csrf';
import { createServiceRoleClient }        from '@/lib/supabase/service';
import { verifyTotp }                     from '@/lib/auth/totp';
import { decrypt }                        from '@/lib/security/encrypt';
import { logAudit }                       from '@/lib/audit';
import { getClientIP }                    from '@/lib/security/rate-limit';

const schema = z.object({
  code: z.string().length(6).regex(/^\d+$/, 'TOTP code must be 6 digits.'),
});

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

  if (!u.totp_enabled) return apiError('MFA is not enabled.', 400);
  if (!u.totp_secret_encrypted) return apiError('MFA configuration corrupted. Contact super_admin.', 500);

  let secret: string;
  try {
    secret = decrypt(u.totp_secret_encrypted);
  } catch {
    return apiError('Failed to read MFA configuration.', 500);
  }

  if (!verifyTotp(secret, code)) {
    return apiError('Invalid TOTP code.', 401);
  }

  await db
    .from('admin_users')
    .update({
      totp_enabled:          false,
      totp_secret_encrypted: null,
      totp_backup_codes:     [],
    })
    .eq('id', session.adminUserId);

  await logAudit({
    action:     'admin.mfa.disabled',
    actor_type: 'admin',
    actor_id:   session.adminUserId,
    details:    {},
    ip_address: getClientIP(request),
  });

  return apiSuccess({ message: 'MFA has been disabled.' });
}
