/**
 * GET /api/notifications — list the authenticated member's own notifications
 *
 * Supports optional status filter and configurable limit (max 50).
 * Only returns notifications where user_id matches the authenticated user —
 * admin/system notifications (user_id = null) are never returned here.
 */

import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }           from '@/lib/supabase/service';

/** Valid notification status values. */
const VALID_STATUSES = new Set(['sent', 'failed', 'queued', 'cancelled']);

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);

  // Optional status filter.
  const statusParam = searchParams.get('status') ?? undefined;
  if (statusParam !== undefined && !VALID_STATUSES.has(statusParam)) {
    return apiError(
      `Invalid status filter. Allowed values: sent, failed, queued, cancelled.`,
      400
    );
  }

  // Limit: default 20, max 50.
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit    = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  const db = createServiceRoleClient();

  try {
    let query = db
      .from('notifications')
      .select(
        `
          id,
          channel,
          template_name,
          status,
          sent_at,
          created_at
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply status filter when provided.
    if (statusParam) {
      query = query.eq('status', statusParam);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/notifications] DB error:', error.message);
      return apiError('Failed to fetch notifications.', 500);
    }

    return apiSuccess({
      notifications: data ?? [],
      total:         count ?? 0,
    });
  } catch (err) {
    console.error('[GET /api/notifications] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}
