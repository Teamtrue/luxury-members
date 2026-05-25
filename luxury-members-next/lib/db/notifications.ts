import { dbQuery } from '@/lib/db/client';

export async function queueNotification(input: {
  id: string;
  userId: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  templateCode: string;
  payload: Record<string, unknown>;
}) {
  await dbQuery(
    `insert into notifications (id, user_id, channel, template_code, payload, status)
     values ($1, $2, $3, $4, $5::jsonb, 'PENDING')`,
    [input.id, input.userId, input.channel, input.templateCode, JSON.stringify(input.payload)]
  );
}

export async function markNotificationSent(id: string) {
  await dbQuery(`update notifications set status = 'SENT', updated_at = now() where id = $1`, [id]);
}

export async function markNotificationFailed(id: string) {
  await dbQuery(`update notifications set status = 'FAILED', updated_at = now() where id = $1`, [id]);
}
