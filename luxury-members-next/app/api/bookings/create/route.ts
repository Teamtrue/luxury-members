import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createBookingSchema } from '@/lib/validation/booking';
import { createBookingRow } from '@/lib/db/bookings';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const bookingId = crypto.randomUUID();

  try {
    await createBookingRow({
      id: bookingId,
      userId: user.id,
      dealId: parsed.data.dealId,
      amountInr: parsed.data.amount,
      tokenRedemption: parsed.data.tokenRedemption
    });
  } catch {
    return NextResponse.json({ error: 'Could not create booking' }, { status: 500 });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'booking.create',
    entityType: 'booking',
    entityId: bookingId,
    metadata: { dealId: parsed.data.dealId, amount: parsed.data.amount }
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: bookingId,
      userId: user.id,
      dealId: parsed.data.dealId,
      amount: parsed.data.amount,
      tokenRedemption: parsed.data.tokenRedemption,
      status: 'PENDING'
    }
  });
}
