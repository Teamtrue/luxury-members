import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { purchaseMembershipSchema } from '@/lib/validation/memberships';
import { createMembership } from '@/lib/db/memberships';
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

  const parsed = purchaseMembershipSchema.safeParse({
    planId: raw.planId,
    autoRenew: raw.autoRenew === true || raw.autoRenew === 'true' || raw.autoRenew === 'on'
  });

  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const now = new Date();
  const ends = new Date(now);
  ends.setDate(ends.getDate() + 365);

  const membershipId = crypto.randomUUID();
  await createMembership({
    id: membershipId,
    userId: user.id,
    planId: parsed.data.planId,
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
    autoRenew: parsed.data.autoRenew
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'membership.purchase',
    entityType: 'membership',
    entityId: membershipId,
    metadata: { planId: parsed.data.planId, autoRenew: parsed.data.autoRenew }
  });

  return NextResponse.json({ ok: true, membershipId });
}
