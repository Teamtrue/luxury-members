import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createDisputeSchema } from '@/lib/validation/memberships';
import { createDispute } from '@/lib/db/reconciliation';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = createDisputeSchema.safeParse({
    paymentId: raw.paymentId,
    reason: raw.reason
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const disputeId = crypto.randomUUID();
  await createDispute({ id: disputeId, paymentId: parsed.data.paymentId, userId: user.id, reason: parsed.data.reason });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'payment.dispute.create',
    entityType: 'payment_dispute',
    entityId: disputeId,
    metadata: { paymentId: parsed.data.paymentId }
  });

  return NextResponse.json({ ok: true, disputeId });
}
