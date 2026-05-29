/**
 * app/api/push/subscribe/route.ts
 * ---------------------------------------------------------------------------
 * Push notification subscription management.
 *
 * POST /api/push/subscribe  — Register or update a push subscription.
 * DELETE /api/push/subscribe — Deactivate a push subscription.
 * ---------------------------------------------------------------------------
 */

import { z } from 'zod';
import { requireAuth, apiSuccess, apiError, parseBody } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const subscribeSchema = z.object({
  endpoint:    z.string().url('endpoint must be a valid URL'),
  p256dh:      z.string().min(1, 'p256dh is required'),
  auth:        z.string().min(1, 'auth is required'),
  platform:    z.enum(['web', 'android', 'ios']),
  device_name: z.string().max(100).optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
});

// ---------------------------------------------------------------------------
// POST — Register / upsert a push subscription
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const bodyResult = await parseBody(request, subscribeSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { endpoint, p256dh, auth, platform, device_name } = bodyResult.data;

  let db;
  try {
    db = createServiceRoleClient();
  } catch {
    return apiError('Service unavailable.', 503);
  }

  const { error } = await db
    .from('push_subscriptions')
    .upsert(
      {
        user_id:      user.id,
        endpoint,
        p256dh,
        auth_key:     auth,
        platform,
        device_name:  device_name ?? null,
        is_active:    true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    return apiError('Failed to register push subscription.', 500);
  }

  return apiSuccess({ subscribed: true }, 200);
}

// ---------------------------------------------------------------------------
// DELETE — Deactivate a push subscription
// ---------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<Response> {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const bodyResult = await parseBody(request, unsubscribeSchema);
  if ('error' in bodyResult) return bodyResult.error;
  const { endpoint } = bodyResult.data;

  let db;
  try {
    db = createServiceRoleClient();
  } catch {
    return apiError('Service unavailable.', 503);
  }

  const { error } = await db
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    return apiError('Failed to unregister push subscription.', 500);
  }

  return apiSuccess({ unsubscribed: true }, 200);
}
