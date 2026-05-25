import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'account.delete.requested',
    entityType: 'user',
    entityId: user.id
  });

  return NextResponse.json({ ok: true, message: 'Account deletion request received' });
}
