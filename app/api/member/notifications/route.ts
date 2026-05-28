/**
 * app/api/member/notifications/route.ts
 * ---------------------------------------------------------------------------
 * GET   /api/member/notifications — fetch recent in-app notifications
 * PATCH /api/member/notifications — mark one or all notifications as read
 * ---------------------------------------------------------------------------
 */

import { z }                       from 'zod';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// GET /api/member/notifications
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const url   = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);

  try {
    const db = createServiceRoleClient();

    const { data: notifications, error } = await db
      .from('notifications')
      .select('id, template_name, template_data, status, priority, read_at, opened_at, created_at')
      .eq('user_id', user.id)
      .eq('channel', 'in_app')
      .eq('status', 'sent')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[member/notifications] fetch error:', error.message);
      return apiError('Failed to fetch notifications.', 500);
    }

    const unreadCount = (notifications ?? []).filter(
      (n: { read_at: string | null }) => n.read_at === null
    ).length;

    return apiSuccess({
      notifications: notifications ?? [],
      unread_count: unreadCount,
    });
  } catch (err) {
    console.error('[member/notifications] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/member/notifications — mark as read
// ---------------------------------------------------------------------------

const patchSchema = z.object({
  /** Specific notification ID to mark read. Omit to mark ALL as read. */
  id:       z.string().uuid().optional(),
  mark_all: z.boolean().optional(),
});

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON.', 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Validation failed.', 400);
  }

  const { id, mark_all } = parsed.data;
  if (!id && !mark_all) {
    return apiError('Provide id or mark_all: true.', 400);
  }

  const readAt = new Date().toISOString();

  try {
    const db = createServiceRoleClient();

    let query = db
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', user.id)
      .eq('channel', 'in_app')
      .is('read_at', null);

    if (id) {
      query = query.eq('id', id);
    }

    const { error } = await query;
    if (error) {
      console.error('[member/notifications] mark-read error:', error.message);
      return apiError('Failed to mark notification as read.', 500);
    }

    return apiSuccess({ marked_read_at: readAt });
  } catch (err) {
    console.error('[member/notifications] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
