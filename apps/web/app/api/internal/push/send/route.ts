/**
 * app/api/internal/push/send/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/push/send
 *
 * Send a Web Push notification to all active push subscriptions for a user.
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 *
 * For now, inserts a queued notification into the notifications table
 * (channel='push') for the dispatch cron to deliver.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Bearer token guard — same pattern as dispatch route
// ---------------------------------------------------------------------------

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[internal/push/send] INTERNAL_JOB_TOKEN not set — skipping auth in dev mode.');
      return null;
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Internal job token not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${expected}`) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const pushSendSchema = z.object({
  user_id: z.string().uuid('user_id must be a valid UUID.'),
  title:   z.string().min(1, 'title is required.').max(200),
  body:    z.string().min(1, 'body is required.').max(500),
  url:     z.string().url().optional(),
  icon:    z.string().url().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/internal/push/send
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const parsed = pushSendSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? 'Validation failed.', 400, parsed.error.issues);
  }

  const { user_id, title, body: notifBody, url, icon } = parsed.data;

  try {
    const db  = createServiceRoleClient();
    const now = new Date().toISOString();

    // Count active push subscriptions for user
    const { data: subscriptions, error: subError } = await db
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (subError) {
      console.error('[internal/push/send] push_subscriptions query error:', subError.message);
      return apiError('Failed to query push subscriptions.', 500);
    }

    const subscriptionCount = (subscriptions ?? []).length;

    // Insert a queued notification for the dispatch cron to handle delivery
    const { error: insertError } = await db.from('notifications').insert({
      user_id,
      channel:       'push',
      template_name: 'PUSH_NOTIFICATION',
      template_data: { title, body: notifBody, url: url ?? null, icon: icon ?? null },
      priority:      'medium',
      status:        'queued',
      scheduled_for: now,
    });

    if (insertError) {
      console.error('[internal/push/send] notification insert error:', insertError.message);
      return apiError('Failed to queue push notification.', 500);
    }

    return apiSuccess({ queued: subscriptionCount });
  } catch (err) {
    console.error('[internal/push/send] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
