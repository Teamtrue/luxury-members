import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { writeAuditLog } from '@/lib/audit/log';
import { isSameOrigin } from '@/lib/security/origin-check';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { resolveDispute } from '@/lib/db/reconciliation';
import { resolveDisputeSchema } from '@/lib/validation/reconciliation';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

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

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = resolveDisputeSchema.safeParse({
    disputeId: raw.disputeId,
    resolution: raw.resolution,
    notes: raw.notes
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await resolveDispute({
    id: parsed.data.disputeId,
    resolution: parsed.data.resolution,
    notes: parsed.data.notes
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'payment.dispute.resolve',
    entityType: 'payment_dispute',
    entityId: parsed.data.disputeId,
    metadata: { resolution: parsed.data.resolution, notes: parsed.data.notes }
  });

  return NextResponse.json({ ok: true });
}
