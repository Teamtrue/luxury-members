/**
 * GET /api/admin/mfa/status
 * Returns whether TOTP MFA is enabled for the authenticated admin.
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }             from '@/lib/supabase/service';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('admin_users')
    .select('totp_enabled')
    .eq('id', session.adminUserId)
    .single();

  if (error || !data) return apiError('Admin not found.', 404);

  return apiSuccess({ totp_enabled: (data as { totp_enabled: boolean }).totp_enabled });
}
