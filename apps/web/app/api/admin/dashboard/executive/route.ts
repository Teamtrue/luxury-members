import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import type { AdminSession } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments:read');
  if ('error' in auth) return (auth as { error: Response }).error;

  const db = createServiceRoleClient();

  const [membersResult, revenueResult, bookingsResult, pendingResult] = await Promise.all([
    db.from('user_profiles').select('id, tier, status', { count: 'exact', head: true }),
    db.from('payments').select('amount').eq('status', 'captured'),
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    db.from('refunds').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalRevenue = (revenueResult.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return NextResponse.json({
    success: true,
    data: {
      total_members: membersResult.count ?? 0,
      total_revenue_inr: totalRevenue,
      confirmed_bookings: bookingsResult.count ?? 0,
      pending_refunds: pendingResult.count ?? 0,
      generated_at: new Date().toISOString(),
    },
  });
}
