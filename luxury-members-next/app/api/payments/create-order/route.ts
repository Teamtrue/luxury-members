import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation/payments';
import { createPaymentRow } from '@/lib/db/bookings';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payment order payload' }, { status: 400 });
  }

  const orderId = `order_${crypto.randomUUID()}`;

  try {
    await createPaymentRow({
      id: crypto.randomUUID(),
      bookingId: parsed.data.bookingId,
      providerOrderId: orderId,
      amountInr: parsed.data.amount
    });
  } catch {
    return NextResponse.json({ error: 'Could not create payment order' }, { status: 500 });
  }

  return NextResponse.json({
    orderId,
    amount: parsed.data.amount,
    currency: 'INR'
  });
}
