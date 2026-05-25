import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { writeAuditLog } from '@/lib/audit/log';

const cancelSchema = z.object({ bookingId: z.string().min(8) });

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

  const body = await req.json();
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'booking.cancel',
    entityType: 'booking',
    entityId: parsed.data.bookingId
  });

  return NextResponse.json({ ok: true, bookingId: parsed.data.bookingId, status: 'CANCELLED' });
}
