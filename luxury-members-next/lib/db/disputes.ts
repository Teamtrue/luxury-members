import { dbQuery } from '@/lib/db/client';

export async function listDisputes(limit = 50, offset = 0) {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const safeOffset = Math.max(0, offset);

  return dbQuery<{
    id: string;
    payment_id: string;
    user_id: string;
    reason: string;
    status: string;
    resolution_notes: string | null;
    created_at: string;
  }>(
    `select id, payment_id, user_id, reason, status, resolution_notes, created_at
     from payment_disputes
     order by created_at desc
     limit $1 offset $2`,
    [safeLimit, safeOffset]
  );
}

export async function resolveDispute(input: {
  disputeId: string;
  status: 'RESOLVED' | 'REJECTED' | 'UNDER_REVIEW';
  resolutionNotes?: string;
}) {
  await dbQuery(
    `update payment_disputes
     set status = $2, resolution_notes = $3, updated_at = now()
     where id = $1`,
    [input.disputeId, input.status, input.resolutionNotes || null]
  );
}
