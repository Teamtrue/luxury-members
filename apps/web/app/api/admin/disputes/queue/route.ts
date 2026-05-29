import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import type { AdminSession } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments:read');
  if ('error' in auth) return (auth as { error: Response }).error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 500);
  const offset = Number(searchParams.get('offset') ?? '0');

  const db = createServiceRoleClient();
  const { data: disputes, error, count } = await db
    .from('payment_disputes')
    .select('id, booking_id, user_id, reason, description, status, created_at', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch disputes queue' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: disputes ?? [], total: count ?? 0 });
}
