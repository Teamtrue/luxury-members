import { dbQuery } from '@/lib/db/client';

type BookingInsert = {
  id: string;
  userId: string;
  dealId: string;
  amountInr: number;
  tokenRedemption: number;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  status: 'CREATED' | 'CAPTURED' | 'FAILED';
  amount_inr: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export async function createBookingRow(input: BookingInsert): Promise<void> {
  await dbQuery(
    `insert into bookings (id, user_id, deal_id, status, amount_inr, token_redemption)
     values ($1, $2, $3, 'PENDING', $4, $5)`,
    [input.id, input.userId, input.dealId, input.amountInr, input.tokenRedemption]
  );
}

export async function createPaymentRow(input: {
  id: string;
  bookingId: string;
  providerOrderId: string;
  amountInr: number;
}): Promise<void> {
  await dbQuery(
    `insert into payments (id, booking_id, provider_order_id, status, amount_inr, currency)
     values ($1, $2, $3, 'CREATED', $4, 'INR')`,
    [input.id, input.bookingId, input.providerOrderId, input.amountInr]
  );
}

export async function findLatestPaymentByBookingId(bookingId: string): Promise<PaymentRow | null> {
  const rows = await dbQuery<PaymentRow>(
    `select id, booking_id, provider_order_id, provider_payment_id, status, amount_inr, currency, created_at, updated_at
     from payments
     where booking_id = $1
     order by created_at desc
     limit 1`,
    [bookingId]
  );

  return rows[0] ?? null;
}

export async function markPaymentCaptured(providerOrderId: string, providerPaymentId: string): Promise<void> {
  await dbQuery(
    `update payments
     set status = 'CAPTURED', provider_payment_id = $2, updated_at = now()
     where provider_order_id = $1`,
    [providerOrderId, providerPaymentId]
  );
}

export async function markPaymentFailed(providerOrderId: string): Promise<void> {
  await dbQuery(
    `update payments
     set status = 'FAILED', updated_at = now()
     where provider_order_id = $1`,
    [providerOrderId]
  );
}
