import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { confirmPasswordResetSchema } from '@/lib/validation/recovery';
import { getOtp, clearOtp, updateUserPassword } from '@/lib/db/recovery';
import { validateStrongPassword } from '@/lib/security/password';
import { hashToken, safeEqualHash } from '@/lib/security/token-hash';
import { isSameOrigin } from '@/lib/security/origin-check';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = confirmPasswordResetSchema.safeParse({
    email: raw.email,
    otp: raw.otp,
    newPassword: raw.newPassword
  });

  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const passwordPolicy = validateStrongPassword(parsed.data.newPassword);
  if (!passwordPolicy.ok) return NextResponse.json({ error: passwordPolicy.reason || 'Weak password' }, { status: 400 });

  const record = await getOtp(parsed.data.email);
  if (!record) return NextResponse.json({ error: 'OTP not found' }, { status: 404 });

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await clearOtp(parsed.data.email);
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  }

  if (!safeEqualHash(record.otp_hash, hashToken(parsed.data.otp, 'otp'))) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }

  const passwordHash = await hash(parsed.data.newPassword, 12);
  await updateUserPassword(parsed.data.email, passwordHash);
  await clearOtp(parsed.data.email);

  return NextResponse.json({ ok: true });
}
