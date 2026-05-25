import { dbQuery } from '@/lib/db/client';

export type ReconciliationStatus = 'MATCHED' | 'MISMATCHED' | 'MISSING_PROVIDER' | 'MISSING_INTERNAL' | 'RESOLVED';

export async function addReconciliationRecord(input: {
  providerOrderId: string;
  providerPaymentId?: string;
  internalPaymentId?: string;
  status: 'MATCHED' | 'MISMATCHED' | 'MISSING_PROVIDER' | 'MISSING_INTERNAL';
  notes?: string;
}): Promise<void> {
  await dbQuery(
    `insert into payment_reconciliation (provider_order_id, provider_payment_id, internal_payment_id, status, notes)
     values ($1, $2, $3, $4, $5)`,
    [input.providerOrderId, input.providerPaymentId || null, input.internalPaymentId || null, input.status, input.notes || null]
  );
}

export async function listReconciliationQueue(limit = 100): Promise<{
  id: number;
  provider_order_id: string;
  provider_payment_id: string | null;
  internal_payment_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}[]> {
  return dbQuery(
    `select id, provider_order_id, provider_payment_id, internal_payment_id, status, notes, created_at
     from payment_reconciliation
     where status in ('MISMATCHED', 'MISSING_PROVIDER', 'MISSING_INTERNAL')
     order by created_at asc
     limit $1`,
    [limit]
  );
}

export async function resolveReconciliation(input: { id: number; notes?: string }): Promise<void> {
  await dbQuery(
    `update payment_reconciliation
     set status = 'RESOLVED', notes = coalesce($2, notes), updated_at = now()
     where id = $1`,
    [input.id, input.notes || null]
  );
}

export async function createDispute(input: {
  id: string;
  paymentId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  await dbQuery(
    `insert into payment_disputes (id, payment_id, user_id, reason, status)
     values ($1, $2, $3, $4, 'OPEN')`,
    [input.id, input.paymentId, input.userId, input.reason]
  );
}

export async function listUserDisputes(userId: string): Promise<{
  id: string;
  payment_id: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}[]> {
  return dbQuery(
    `select id, payment_id, reason, status, resolution_notes, created_at, updated_at
     from payment_disputes
     where user_id = $1
     order by created_at desc`,
    [userId]
  );
}

export async function listOpenDisputes(limit = 100): Promise<{
  id: string;
  payment_id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
}[]> {
  return dbQuery(
    `select id, payment_id, user_id, reason, status, created_at
     from payment_disputes
     where status = 'OPEN'
     order by created_at asc
     limit $1`,
    [limit]
  );
}

export async function resolveDispute(input: { id: string; resolution: 'RESOLVED' | 'REJECTED'; notes?: string }): Promise<void> {
  await dbQuery(
    `update payment_disputes
     set status = $2, resolution_notes = $3, updated_at = now()
     where id = $1`,
    [input.id, input.resolution, input.notes || null]
  );
}
