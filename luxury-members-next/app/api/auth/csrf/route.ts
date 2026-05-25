import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { createCsrfToken } from '@/lib/security/csrf';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrfToken = createCsrfToken(user.id);
  const res = NextResponse.json({ csrfToken });
  res.cookies.set('lm_csrf', csrfToken, { httpOnly: false, secure: true, sameSite: 'lax', path: '/' });
  return res;
}
