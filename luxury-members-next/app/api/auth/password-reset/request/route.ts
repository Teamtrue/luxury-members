import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requestPasswordResetSchema } from '@/lib/validation/recovery';
import { upsertOtp } from '@/lib/db/recovery';
import { checkDistributedRateLimit } from '@/lib/security/distributed-rate-limit';
import { queueNotification } from '@/lib/db/notifications';
import { dbQuery } from '@/lib/db/client';

function hashOtp(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const allowed = await checkDistributedRateLimit(`reset_req:${ip}`, 8, 60_000);
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = requestPasswordResetSchema.safeParse({ email: raw.email });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60_000).toISOString();
  await upsertOtp(parsed.data.email, hashOtp(otp), expires);

  const allowDevOtp = process.env.ALLOW_DEV_OTP_RESPONSE === 'true' && process.env.NODE_ENV !== 'production';

  const userRows = await dbQuery<{ id: string }>('select id from users where email = $1 limit 1', [parsed.data.email]);
  if (userRows.length > 0) {
    await queueNotification({
      id: crypto.randomUUID(),
      userId: userRows[0].id,
      channel: 'EMAIL',
      templateCode: 'PASSWORD_RESET_OTP',
      payload: allowDevOtp
        ? { otp, expiresAt: expires }
        : { message: 'Use password reset OTP sent to your registered channel', expiresAt: expires }
    });
  }

  return NextResponse.json(
    allowDevOtp
      ? { ok: true, message: 'OTP issued', otpForDev: otp }
      : { ok: true, message: 'If the email exists, OTP has been sent' }
  );
}
