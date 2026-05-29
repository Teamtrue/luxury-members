import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import type { AdminSession } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'refunds:read');
  if ('error' in auth) return (auth as { error: Response }).error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 500);
  const offset = Number(searchParams.get('offset') ?? '0');

  const db = createServiceRoleClient();
  const { data: refunds, error, count } = await db
    .from('refunds')
    .select('id, booking_id, user_id, reason, requested_amount_inr, status, created_at', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch refund queue' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: refunds ?? [], total: count ?? 0 });
}
