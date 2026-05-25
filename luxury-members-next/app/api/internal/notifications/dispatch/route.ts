import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db/client';
import { sendNotification } from '@/lib/notifications/provider';
import { markNotificationSent, markNotificationFailed } from '@/lib/db/notifications';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await dbQuery<{
    id: string;
    user_id: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    template_code: string;
    payload: Record<string, unknown>;
  }>(
    `select id, user_id, channel, template_code, payload
     from notifications
     where status = 'PENDING'
     order by created_at asc
     limit 50`
  );

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    const result = await sendNotification({
      userId: item.user_id,
      channel: item.channel,
      templateCode: item.template_code,
      data: item.payload
    });

    if (result.ok) {
      sent += 1;
      await markNotificationSent(item.id);
    } else {
      failed += 1;
      await markNotificationFailed(item.id);
    }
  }

  return NextResponse.json({ ok: true, sent, failed, processed: pending.length });
}
