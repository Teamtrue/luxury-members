import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation/auth';
import { createSessionToken } from '@/lib/auth/session';
import { permissionsForRole } from '@/lib/auth/rbac';
import { Role } from '@/types/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  const contentType = req.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = loginSchema.safeParse({
    email: data.email,
    password: data.password,
    admin: data.admin === 'true' || data.admin === true
  });

  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const role: Role = parsed.data.admin ? 'ADMIN' : 'USER';
  const token = await createSessionToken({
    id: crypto.randomUUID(),
    email: parsed.data.email,
    role,
    permissions: permissionsForRole(role)
  });

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set('lm_session', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  return res;
}
