import { dbQuery } from '@/lib/db/client';

export async function createRefundRequest(input: {
  id: string;
  bookingId: string;
  userId: string;
  reason: string;
  requestedAmountInr: number;
}): Promise<void> {
  await dbQuery(
    `insert into refunds (id, booking_id, user_id, reason, requested_amount_inr, status)
     values ($1, $2, $3, $4, $5, 'REQUESTED')`,
    [input.id, input.bookingId, input.userId, input.reason, input.requestedAmountInr]
  );
}

export async function listUserRefunds(userId: string): Promise<{
  id: string;
  booking_id: string;
  reason: string;
  requested_amount_inr: number;
  approved_amount_inr: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}[]> {
  return dbQuery(
    `select id, booking_id, reason, requested_amount_inr, approved_amount_inr, status, created_at, updated_at
     from refunds
     where user_id = $1
     order by created_at desc`,
    [userId]
  );
}

export async function listOpenRefunds(limit = 200): Promise<{
  id: string;
  booking_id: string;
  user_id: string;
  reason: string;
  requested_amount_inr: number;
  status: string;
  created_at: string;
}[]> {
  return dbQuery(
    `select id, booking_id, user_id, reason, requested_amount_inr, status, created_at
     from refunds
     where status = 'REQUESTED'
     order by created_at asc
     limit $1`,
    [limit]
  );
}

export async function resolveRefundRequest(input: {
  id: string;
  decision: 'APPROVED' | 'REJECTED';
  approvedAmountInr?: number;
  notes?: string;
}): Promise<void> {
  await dbQuery(
    `update refunds
     set status = $2,
         approved_amount_inr = $3,
         resolution_notes = $4,
         updated_at = now()
     where id = $1`,
    [input.id, input.decision, input.approvedAmountInr ?? null, input.notes ?? null]
  );
}
