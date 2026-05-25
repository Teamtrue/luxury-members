import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { signupSchema } from '@/lib/validation/auth';
import { dbQuery } from '@/lib/db/client';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = signupSchema.safeParse({
    email: raw.email,
    fullName: raw.fullName,
    password: raw.password,
    confirmPassword: raw.confirmPassword,
    acceptedTerms: raw.acceptedTerms === true || raw.acceptedTerms === 'true' || raw.acceptedTerms === 'on'
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup input', issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await dbQuery<{ id: string }>('select id from users where email = $1 limit 1', [parsed.data.email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hash(parsed.data.password, 12);

  await dbQuery(
    `insert into users (id, email, full_name, password_hash, role, is_active)
     values ($1, $2, $3, $4, 'USER', true)`,
    [id, parsed.data.email, parsed.data.fullName, passwordHash]
  );

  await writeAuditLog({
    actorUserId: id,
    action: 'auth.signup',
    entityType: 'user',
    entityId: id,
    metadata: { email: parsed.data.email }
  });

  return NextResponse.json({ ok: true, userId: id });
}
