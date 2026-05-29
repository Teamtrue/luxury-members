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
  const { data: records, error, count } = await db
    .from('payment_reconciliation')
    .select('id, provider_order_id, provider_payment_id, internal_payment_id, status, notes, created_at', { count: 'exact' })
    .in('status', ['mismatched', 'missing_provider', 'missing_internal'])
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reconciliation queue' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: records ?? [], total: count ?? 0 });
}
