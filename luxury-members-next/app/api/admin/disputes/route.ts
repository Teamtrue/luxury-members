import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { listDisputes, resolveDispute } from '@/lib/db/disputes';
import { resolveDisputeSchema } from '@/lib/validation/disputes';
import { writeAuditLog } from '@/lib/audit/log';
import { isSameOrigin } from '@/lib/security/origin-check';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const offset = Number(req.nextUrl.searchParams.get('offset') || 0);
  const disputes = await listDisputes(limit, offset);
  return NextResponse.json({ ok: true, disputes });
}

async function updateDispute(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = resolveDisputeSchema.safeParse({
    disputeId: raw.disputeId,
    status: raw.status,
    resolutionNotes: raw.resolutionNotes
  });

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

export async function PATCH(req: NextRequest) {
  return updateDispute(req);
}

export async function POST(req: NextRequest) {
  return updateDispute(req);
}
