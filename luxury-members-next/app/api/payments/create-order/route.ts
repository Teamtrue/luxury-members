import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validation/payments';
import { createPaymentRow } from '@/lib/db/bookings';
import { verifySessionToken } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrfToken = req.headers.get('x-csrf-token') || '';
  const csrfCookie = req.cookies.get('lm_csrf')?.value || '';
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie || !verifyCsrfToken(user.id, csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

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

  await writeAuditLog({
    actorUserId: user.id,
    action: 'payment.order.create',
    entityType: 'payment_order',
    entityId: orderId,
    metadata: { bookingId: parsed.data.bookingId, amount: parsed.data.amount }
  });

  return NextResponse.json({
    orderId,
    amount: parsed.data.amount,
    currency: 'INR'
  });
}
