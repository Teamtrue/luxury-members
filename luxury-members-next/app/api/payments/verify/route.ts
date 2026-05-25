import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { verifyPaymentSchema } from '@/lib/validation/payments';
import { markPaymentCaptured } from '@/lib/db/bookings';
import { writeAuditLog } from '@/lib/audit/log';

function sign(orderId: string, paymentId: string) {
  const secret = process.env.PAYMENT_SIGNING_SECRET || '';
  return createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

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

  if (!process.env.PAYMENT_SIGNING_SECRET) {
    return NextResponse.json({ error: 'Payment signing secret not configured' }, { status: 500 });
  }

  const parsed = verifyPaymentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const expected = sign(parsed.data.orderId, parsed.data.paymentId);
  if (expected.length !== parsed.data.signature.length) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const valid = timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.data.signature));
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  await markPaymentCaptured(parsed.data.orderId, parsed.data.paymentId);

  await writeAuditLog({
    actorUserId: user.id,
    action: 'payment.verify',
    entityType: 'payment_order',
    entityId: parsed.data.orderId,
    metadata: { paymentId: parsed.data.paymentId }
  });

  return NextResponse.json({ ok: true });
}
