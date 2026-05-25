import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listReconciliationQueue } from '@/lib/db/reconciliation';
import { reconciliationQueueQuerySchema } from '@/lib/validation/reconciliation';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = reconciliationQueueQuerySchema.safeParse({
    limit: Number(req.nextUrl.searchParams.get('limit') || 100)
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

  const items = await listReconciliationQueue(parsed.data.limit);
  return NextResponse.json({ ok: true, items });
}
