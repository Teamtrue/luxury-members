import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { dbQuery } from '@/lib/db/client';
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

  const memberships = await dbQuery<{ id: string; status: string; starts_at: string; ends_at: string }>(
    `select id, status, starts_at, ends_at from memberships where user_id = $1 order by created_at desc`,
    [user.id]
  );
  const bookings = await dbQuery<{ id: string; status: string; amount_inr: number; created_at: string }>(
    `select id, status, amount_inr, created_at from bookings where user_id = $1 order by created_at desc`,
    [user.id]
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, role: user.role },
    memberships,
    bookings
  };

  const body = JSON.stringify(payload, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="member-data-${user.id}.json"`
    }
  });
}
