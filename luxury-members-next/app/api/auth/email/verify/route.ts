import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/validation/email-verification';
import { getEmailVerificationToken, markEmailVerified } from '@/lib/db/email-verification';
import { hashToken, safeEqualHash } from '@/lib/security/token-hash';

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = verifyEmailSchema.safeParse({ userId: raw.userId, token: raw.token });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const record = await getEmailVerificationToken(parsed.data.userId);
  if (!record) return NextResponse.json({ error: 'Verification token not found' }, { status: 404 });
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Verification token expired' }, { status: 400 });
  }

  if (!safeEqualHash(record.token_hash, hashToken(parsed.data.token, 'email_verify'))) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  await markEmailVerified(parsed.data.userId);
  return NextResponse.json({ ok: true });
}
