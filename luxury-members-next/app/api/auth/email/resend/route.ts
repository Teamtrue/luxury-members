import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { checkDistributedRateLimit } from '@/lib/security/distributed-rate-limit';
import { dbQuery } from '@/lib/db/client';
import { upsertEmailVerificationToken } from '@/lib/db/email-verification';
import { queueNotification } from '@/lib/db/notifications';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const allowed = await checkDistributedRateLimit(`resend_verify:${ip}`, 5, 60_000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const email = String(raw.email || '').trim().toLowerCase();
  if (!email.includes('@')) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const users = await dbQuery<{ id: string; email_verified: boolean }>(
    `select id, email_verified from users where email = $1 limit 1`,
    [email]
  );

  if (users.length === 0) {
    return NextResponse.json({ ok: true, message: 'If account exists, verification has been sent' });
  }

  if (users[0].email_verified) {
    return NextResponse.json({ ok: true, message: 'Email already verified' });
  }

  const token = randomBytes(24).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  await upsertEmailVerificationToken(users[0].id, tokenHash, expiresAt);

  await queueNotification({
    id: crypto.randomUUID(),
    userId: users[0].id,
    channel: 'EMAIL',
    templateCode: 'VERIFY_EMAIL',
    payload: { userId: users[0].id, token, expiresAt }
  });

  return NextResponse.json({ ok: true, message: 'If account exists, verification has been sent' });
}
