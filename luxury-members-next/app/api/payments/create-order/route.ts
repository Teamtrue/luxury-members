import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation/payments';
import { createPaymentRow } from '@/lib/db/bookings';

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = createOrderSchema.safeParse({
    bookingId: raw.bookingId,
    amount: Number(raw.amount)
  });

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
