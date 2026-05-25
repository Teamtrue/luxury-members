import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/security/csrf';
import { writeAuditLog } from '@/lib/audit/log';
import { createRefundRequestSchema } from '@/lib/validation/refunds';
import { createRefundRequest } from '@/lib/db/refunds';

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

  const parsed = createRefundRequestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const refundId = crypto.randomUUID();
  await createRefundRequest({
    id: refundId,
    bookingId: parsed.data.bookingId,
    userId: user.id,
    reason: parsed.data.reason,
    requestedAmountInr: parsed.data.requestedAmountInr
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'refund.request.create',
    entityType: 'refund',
    entityId: refundId,
    metadata: { bookingId: parsed.data.bookingId, requestedAmountInr: parsed.data.requestedAmountInr }
  });

  return NextResponse.json({ ok: true, refundId });
}
