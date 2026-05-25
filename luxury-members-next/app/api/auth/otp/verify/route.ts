import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpSchema } from '@/lib/validation/recovery';
import { getOtp } from '@/lib/db/recovery';
import { hashToken, safeEqualHash } from '@/lib/security/token-hash';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const record = await getOtp(parsed.data.email);
  if (!record) return NextResponse.json({ error: 'OTP not found' }, { status: 404 });
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
  }

  if (!safeEqualHash(record.otp_hash, hashToken(parsed.data.otp, 'otp'))) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
