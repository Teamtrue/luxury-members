import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { signupSchema } from '@/lib/validation/auth';
import { dbQuery } from '@/lib/db/client';
import { writeAuditLog } from '@/lib/audit/log';
import { validateStrongPassword } from '@/lib/security/password';
import { upsertEmailVerificationToken } from '@/lib/db/email-verification';
import { queueNotification } from '@/lib/db/notifications';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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

  const passwordPolicy = validateStrongPassword(parsed.data.password);
  if (!passwordPolicy.ok) {
    return NextResponse.json({ error: passwordPolicy.reason || 'Weak password' }, { status: 400 });
  }

  const existing = await dbQuery<{ id: string }>('select id from users where email = $1 limit 1', [parsed.data.email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hash(parsed.data.password, 12);

  await dbQuery(
    `insert into users (id, email, full_name, password_hash, email_verified, role, is_active)
     values ($1, $2, $3, $4, false, 'USER', true)`,
    [id, parsed.data.email, parsed.data.fullName, passwordHash]
  );

  const verifyToken = randomBytes(24).toString('hex');
  const verifyHash = hashToken(verifyToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  await upsertEmailVerificationToken(id, verifyHash, expiresAt);

  await queueNotification({
    id: crypto.randomUUID(),
    userId: id,
    channel: 'EMAIL',
    templateCode: 'VERIFY_EMAIL',
    payload: { userId: id, token: verifyToken, expiresAt }
  });

  await writeAuditLog({
    actorUserId: id,
    action: 'auth.signup',
    entityType: 'user',
    entityId: id,
    metadata: { email: parsed.data.email }
  });

  return NextResponse.json({ ok: true, userId: id, verificationRequired: true });
}
