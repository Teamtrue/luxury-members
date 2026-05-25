import { dbQuery } from '@/lib/db/client';

type BookingInsert = {
  id: string;
  userId: string;
  dealId: string;
  amountInr: number;
  tokenRedemption: number;
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

export async function markPaymentCaptured(providerOrderId: string, providerPaymentId: string): Promise<void> {
  await dbQuery(
    `update payments
     set status = 'CAPTURED', provider_payment_id = $2, updated_at = now()
     where provider_order_id = $1`,
    [providerOrderId, providerPaymentId]
  );
}
