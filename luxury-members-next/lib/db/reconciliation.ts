import { dbQuery } from '@/lib/db/client';

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
