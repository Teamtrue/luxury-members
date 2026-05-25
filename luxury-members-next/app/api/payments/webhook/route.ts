import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { webhookPaymentSchema } from '@/lib/validation/payments';
import { markPaymentCaptured, markPaymentFailed } from '@/lib/db/bookings';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-provider-signature') || '';
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';

  if (!secret || !signature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  if (expected.length !== signature.length) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const valid = timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = webhookPaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  if (parsed.data.event === 'payment.captured') {
    await markPaymentCaptured(parsed.data.orderId, parsed.data.paymentId);
  } else if (parsed.data.event === 'payment.failed') {
    await markPaymentFailed(parsed.data.orderId);
  }

  await writeAuditLog({
    actorUserId: 'system-webhook',
    action: 'payment.webhook',
    entityType: 'payment_order',
    entityId: parsed.data.orderId,
    metadata: {
      paymentId: parsed.data.paymentId,
      event: parsed.data.event
    }
  });

  return NextResponse.json({ ok: true });
}
