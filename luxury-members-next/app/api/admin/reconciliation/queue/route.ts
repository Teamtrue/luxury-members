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

  const items = await dbQuery<{
    id: number;
    provider_order_id: string;
    provider_payment_id: string | null;
    internal_payment_id: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  }>(
    `select id, provider_order_id, provider_payment_id, internal_payment_id, status, notes, created_at
     from payment_reconciliation
     where status in ('MISMATCHED', 'MISSING_PROVIDER', 'MISSING_INTERNAL')
     order by created_at desc
     limit 300`
  );

  return NextResponse.json({ ok: true, items });
}
