import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { writeAuditLog } from '@/lib/audit/log';
import { resolveRefundRequestSchema } from '@/lib/validation/refunds';
import { resolveRefundRequest } from '@/lib/db/refunds';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const csrfToken = req.headers.get('x-csrf-token') || '';
  const csrfCookie = req.cookies.get('lm_csrf')?.value || '';
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie || !verifyCsrfToken(actor.id, csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const parsed = resolveRefundRequestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await resolveRefundRequest({
    id: parsed.data.refundId,
    decision: parsed.data.decision,
    approvedAmountInr: parsed.data.approvedAmountInr,
    notes: parsed.data.notes
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'refund.request.resolve',
    entityType: 'refund',
    entityId: parsed.data.refundId,
    metadata: {
      decision: parsed.data.decision,
      approvedAmountInr: parsed.data.approvedAmountInr,
      notes: parsed.data.notes
    }
  });

  return NextResponse.json({ ok: true });
}
