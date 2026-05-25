import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listDisputes, resolveDispute } from '@/lib/db/disputes';
import { resolveDisputeSchema } from '@/lib/validation/disputes';
import { writeAuditLog } from '@/lib/audit/log';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const disputes = await listDisputes();
  return NextResponse.json({ ok: true, disputes });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = resolveDisputeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await resolveDispute(parsed.data);
  await writeAuditLog({
    actorUserId: actor.id,
    action: 'payment.dispute.update',
    entityType: 'payment_dispute',
    entityId: parsed.data.disputeId,
    metadata: parsed.data
  });

  return NextResponse.json({ ok: true });
}
