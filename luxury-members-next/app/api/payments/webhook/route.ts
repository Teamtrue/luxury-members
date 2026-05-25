import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

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
  return NextResponse.json({ ok: true });
}
