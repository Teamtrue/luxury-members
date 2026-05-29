/**
 * app/api/admin/support/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/admin/support — list all support tickets with member info
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError, requireAdmin } from '@/lib/api-helpers';
import { createServiceRoleClient }            from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// GET /api/admin/support
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  try {
    const db = createServiceRoleClient();

    let query = db
      .from('support_tickets')
      .select(
        `
        id,
        ticket_ref,
        category,
        status,
        subject,
        messages,
        created_at,
        updated_at,
        user_profiles!support_tickets_user_id_fkey ( id, full_name, phone )
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[admin/support] GET query error:', error.message);
      return apiError('Failed to fetch support tickets.', 500);
    }

    return apiSuccess({ tickets: data ?? [] });
  } catch (err) {
    console.error('[admin/support] GET unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
