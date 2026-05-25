import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { createDealSchema, updateDealSchema, deleteDealSchema } from '@/lib/validation/deals';
import { listDeals, createDeal, updateDeal, deleteDeal } from '@/lib/db/deals';
import { writeAuditLog } from '@/lib/audit/log';
import { isSameOrigin } from '@/lib/security/origin-check';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('deals.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const offset = Number(req.nextUrl.searchParams.get('offset') || 0);
  const query = req.nextUrl.searchParams.get('q') || '';

  const deals = await listDeals(limit, offset, query);
  return NextResponse.json({ ok: true, deals });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('deals.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());
  const parsed = createDealSchema.safeParse({
    title: raw.title,
    description: raw.description,
    priceInr: Number(raw.priceInr),
    isActive: raw.isActive === true || raw.isActive === 'true' || raw.isActive === 'on'
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const id = crypto.randomUUID();
  await createDeal({ id, ...parsed.data });
  await writeAuditLog({ actorUserId: actor.id, action: 'deal.create', entityType: 'deal', entityId: id, metadata: parsed.data });

  return NextResponse.json({ ok: true, dealId: id });
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('deals.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateDealSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await updateDeal(parsed.data);
  await writeAuditLog({ actorUserId: actor.id, action: 'deal.update', entityType: 'deal', entityId: parsed.data.dealId, metadata: parsed.data });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('deals.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = deleteDealSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await deleteDeal(parsed.data.dealId);
  await writeAuditLog({ actorUserId: actor.id, action: 'deal.delete', entityType: 'deal', entityId: parsed.data.dealId });

  return NextResponse.json({ ok: true });
}
