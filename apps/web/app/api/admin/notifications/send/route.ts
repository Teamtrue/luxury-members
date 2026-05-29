/**
 * POST /api/admin/notifications/send — Broadcast notification to members
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }            from '@/lib/supabase/service';
import { logAudit }                           from '@/lib/audit';
import { z }                                  from 'zod';

const sendSchema = z.object({
  target:   z.enum(['all', 'tier', 'member']),
  tier:     z.enum(['silver', 'gold', 'platinum', 'obsidian']).optional(),
  user_id:  z.string().uuid().optional(),
  channel:  z.enum(['email', 'sms', 'push']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  subject:  z.string().min(1).max(200),
  body:     z.string().min(1).max(2000),
});

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'notifications:send');
  if ('error' in auth) return auth.error;

  let body: z.infer<typeof sendSchema>;
  try {
    const raw = await request.json();
    body = sendSchema.parse(raw);
  } catch (e) {
    return apiError('Invalid request body.', 400);
  }

  const db = createServiceRoleClient();

  // Collect target user IDs
  let userIds: string[] = [];

  if (body.target === 'member') {
    if (!body.user_id) return apiError('user_id required for target=member.', 400);
    userIds = [body.user_id];

  } else if (body.target === 'tier') {
    if (!body.tier) return apiError('tier required for target=tier.', 400);
    const { data, error } = await db
      .from('user_profiles')
      .select('id')
      .eq('membership_tier', body.tier)
      .limit(1000);
    if (error) return apiError('Failed to fetch members.', 500);
    userIds = (data ?? []).map((r: Record<string, unknown>) => r.id as string);

  } else {
    // all
    const { data, error } = await db
      .from('user_profiles')
      .select('id')
      .limit(1000);
    if (error) return apiError('Failed to fetch members.', 500);
    userIds = (data ?? []).map((r: Record<string, unknown>) => r.id as string);
  }

  if (userIds.length === 0) return apiSuccess({ queued: 0 });

  // Batch insert notifications
  const rows = userIds.map(uid => ({
    user_id:       uid,
    channel:       body.channel,
    priority:      body.priority,
    status:        'queued',
    template_name: 'ADMIN_BROADCAST',
    template_data: { subject: body.subject, body: body.body },
    scheduled_for: new Date().toISOString(),
  }));

  const { error: insertError } = await db.from('notifications').insert(rows);
  if (insertError) {
    console.error('[POST /api/admin/notifications/send] insert error:', insertError.message);
    return apiError('Failed to queue notifications.', 500);
  }

  await logAudit({
    action:     'admin.notification_sent',
    actor_type: 'admin',
    actor_id:   (auth as unknown as { session: { admin_id?: string } }).session?.admin_id,
    details:    { target: body.target, tier: body.tier, count: userIds.length, channel: body.channel },
  });

  return apiSuccess({ queued: userIds.length });
}
