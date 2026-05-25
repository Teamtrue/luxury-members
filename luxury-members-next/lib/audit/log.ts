import { dbQuery } from '@/lib/db/client';
import { emitAuditEvent } from '@/lib/audit/sink';

type AuditEvent = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  try {
    await dbQuery(
      `insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [event.actorUserId, event.action, event.entityType, event.entityId, JSON.stringify(event.metadata || {})]
    );
  } catch {
    console.info('AUDIT_FALLBACK', {
      ...event,
      createdAt: new Date().toISOString()
    });
  }

  await emitAuditEvent({
    ...event,
    createdAt: new Date().toISOString()
  });
}
