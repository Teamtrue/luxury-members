// Audit log for admin actions — in production, write to Supabase audit_log table

export type AuditAction =
  | 'member.tier_changed'
  | 'member.suspended'
  | 'member.reactivated'
  | 'member.tokens_added'
  | 'deal.created'
  | 'deal.status_changed'
  | 'deal.price_changed'
  | 'admin.login'
  | 'member.deleted';

export interface AuditEntry {
  action: AuditAction;
  actor_id: string;       // admin member ID
  target_id?: string;     // affected member/deal ID
  details: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

// In-memory log (dev only) — replace with Supabase insert in production
const auditLog: AuditEntry[] = [];

export async function logAudit(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  const fullEntry: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
  auditLog.push(fullEntry);
  console.log('[AUDIT]', fullEntry);

  // TODO: Supabase insert
  // const supabase = createServiceRoleClient();
  // await supabase.from('audit_log').insert(fullEntry);
}

export function getAuditLog(): AuditEntry[] {
  return auditLog;
}
