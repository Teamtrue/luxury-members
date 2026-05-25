import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/lib/validation/auth';
import { createSessionToken } from '@/lib/auth/session';
import { permissionsForRole } from '@/lib/auth/rbac';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { findUserByEmail, getUserCustomPermissions } from '@/lib/db/users';
import { Permission } from '@/types/auth';

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

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !user.is_active) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const passwordOk = await compare(parsed.data.password, user.password_hash);
  if (!passwordOk) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.email_verified) {
    return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
  }

  if (parsed.data.admin && !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(user.role)) {
    return NextResponse.json({ error: 'Admin access denied' }, { status: 403 });
  }

  const rolePermissions = permissionsForRole(user.role);
  const customPermissions = (await getUserCustomPermissions(user.id)) as Permission[];
  const mergedPermissions = [...new Set([...rolePermissions, ...customPermissions])];

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: mergedPermissions
  });

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set('lm_session', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  return res;
}
