/**
 * lib/audit.ts
 * ---------------------------------------------------------------------------
 * Audit log writer — writes to audit_logs table via service role.
 *
 * Contract:
 *   - NEVER throws — logging failures must not break the main request.
 *   - Falls back to console.error so failures are surfaced in observability
 *     tooling (Vercel logs, Datadog, etc.) without crashing the caller.
 * ---------------------------------------------------------------------------
 */

import { createServiceRoleClient } from '@/lib/supabase/service';

export type AuditAction =
  | 'member.created'
  | 'member.updated'
  | 'member.tier_changed'
  | 'member.suspended'
  | 'member.reactivated'
  | 'member.tokens_adjusted'
  | 'member.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.status_changed'
  | 'deal.price_changed'
  | 'booking.created'
  | 'booking.cancelled'
  | 'payment.verified'
  | 'payment.failed'
  | 'payment.webhook_received'
  | 'referral.created'
  | 'admin.login'
  | 'admin.logout'
  | (string & Record<never, never>); // allow arbitrary strings while keeping autocomplete

export interface AuditEntry {
  action:       AuditAction;
  actor_type:   'member' | 'admin' | 'system';
  actor_id?:    string;    // UUID – auth.users.id for members, admin_users.id for admins
  target_type?: string;    // e.g. 'booking', 'deal', 'member'
  target_id?:   string;    // UUID of the affected record
  details:      Record<string, unknown>;
  ip_address?:  string;
  user_agent?:  string;
}

/**
 * Write an audit log entry to the audit_logs table.
 *
 * Swallows all errors — callers must not depend on this succeeding.
 * Always log synchronously to console so failures appear in observability.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  const fullEntry = {
    ...entry,
    created_at: new Date().toISOString(),
  };

  // Always emit to structured logs (picked up by Vercel / Datadog).
  console.log('[AUDIT]', JSON.stringify(fullEntry));

  try {
    const db = createServiceRoleClient();
    const { error } = await db.from('audit_logs').insert({
      action:      fullEntry.action,
      actor_type:  fullEntry.actor_type,
      actor_id:    fullEntry.actor_id    ?? null,
      target_type: fullEntry.target_type ?? null,
      target_id:   fullEntry.target_id   ?? null,
      details:     fullEntry.details,
      ip_address:  fullEntry.ip_address  ?? null,
      user_agent:  fullEntry.user_agent  ?? null,
    });

    if (error) {
      console.error('[AUDIT] DB insert failed:', error.message, '| Entry:', JSON.stringify(fullEntry));
    }
  } catch (err) {
    // Never propagate — audit failure must not fail the request.
    console.error('[AUDIT] Unexpected error writing audit log:', err, '| Entry:', JSON.stringify(fullEntry));
  }
}
