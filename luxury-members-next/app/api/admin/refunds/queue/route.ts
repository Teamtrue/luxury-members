import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listOpenRefunds } from '@/lib/db/refunds';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') || 100);
  const items = await listOpenRefunds(Math.max(1, Math.min(500, limit)));
  return NextResponse.json({ ok: true, items });
}
