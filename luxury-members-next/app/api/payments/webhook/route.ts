import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { webhookPaymentSchema } from '@/lib/validation/payments';
import { markPaymentCaptured } from '@/lib/db/bookings';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-provider-signature') || '';
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const valid = timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  const parsed = webhookPaymentSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  if (parsed.data.event === 'payment.captured') {
    await markPaymentCaptured(parsed.data.orderId, parsed.data.paymentId);
  }

  return NextResponse.json({ ok: true });
}
