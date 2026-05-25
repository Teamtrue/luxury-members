import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { dbQuery } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [members] = await dbQuery<{ count: number }>(`select count(*)::int as count from users where is_active = true`);
  const [bookings] = await dbQuery<{ count: number }>(`select count(*)::int as count from bookings`);
  const [captured] = await dbQuery<{ amount: number }>(`select coalesce(sum(amount_inr),0)::int as amount from payments where status = 'CAPTURED'`);
  const [openDisputes] = await dbQuery<{ count: number }>(`select count(*)::int as count from payment_disputes where status = 'OPEN'`);
  const [openRefunds] = await dbQuery<{ count: number }>(`select count(*)::int as count from refunds where status = 'REQUESTED'`);

  return NextResponse.json({
    ok: true,
    metrics: {
      activeMembers: members?.count ?? 0,
      totalBookings: bookings?.count ?? 0,
      capturedRevenueInr: captured?.amount ?? 0,
      openDisputes: openDisputes?.count ?? 0,
      openRefunds: openRefunds?.count ?? 0
    },
    generatedAt: new Date().toISOString()
  });
}
