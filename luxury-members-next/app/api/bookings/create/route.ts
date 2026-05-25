import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createBookingSchema } from '@/lib/validation/booking';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  return NextResponse.json({
    ok: true,
    booking: {
      id: crypto.randomUUID(),
      userId: user.id,
      dealId: parsed.data.dealId,
      amount: parsed.data.amount,
      tokenRedemption: parsed.data.tokenRedemption,
      status: 'PENDING'
    }
  });
}
