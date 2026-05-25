type AuditEvent = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  // TODO: replace with DB insert
  console.info('AUDIT', {
    ...event,
    createdAt: new Date().toISOString()
  });
}
