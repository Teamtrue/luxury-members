import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db/client';
import { sendNotification } from '@/lib/notifications/provider';
import { markNotificationSent, markNotificationFailed } from '@/lib/db/notifications';
import { getSecret } from '@/lib/security/secrets';
import { emitSiemEvent } from '@/lib/security/siem';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = getSecret('INTERNAL_JOB_TOKEN');
  if (!token || token !== expected) {
    await emitSiemEvent({ type: 'internal_job_auth_failed', job: 'notifications_dispatch', ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await dbQuery<{
    id: string;
    user_id: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    template_code: string;
    payload: Record<string, unknown>;
    email: string | null;
  }>(
    `select n.id, n.user_id, n.channel, n.template_code, n.payload, u.email
     from notifications n
     left join users u on u.id = n.user_id
     where n.status = 'PENDING'
     order by n.created_at asc
     limit 50`
  );

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    const mergedData = { ...item.payload, email: item.email };
    const result = await sendNotification({
      userId: item.user_id,
      channel: item.channel,
      templateCode: item.template_code,
      data: mergedData
    });

    if (result.ok) {
      sent += 1;
      await markNotificationSent(item.id);
    } else {
      failed += 1;
      await markNotificationFailed(item.id);
    }
  }

  await emitSiemEvent({ type: 'internal_job_success', job: 'notifications_dispatch', sent, failed, processed: pending.length, ts: new Date().toISOString() });
  return NextResponse.json({ ok: true, sent, failed, processed: pending.length });
}
