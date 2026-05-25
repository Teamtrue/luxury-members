import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit/log';
import { verifyCsrfToken } from '@/lib/security/csrf';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrfToken = req.headers.get('x-csrf-token') || '';
  const csrfCookie = req.cookies.get('lm_csrf')?.value || '';
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie || !verifyCsrfToken(user.id, csrfToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: 'account.delete.requested',
    entityType: 'user',
    entityId: user.id
  });

  return NextResponse.json({ ok: true, message: 'Account deletion request received' });
}
