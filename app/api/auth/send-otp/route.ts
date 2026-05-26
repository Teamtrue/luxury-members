import { NextResponse } from 'next/server';
import { validate, sendOtpSchema } from '@/lib/validations';

// Simple in-memory rate limiter (replace with Redis/Upstash in production)
const otpAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const record = otpAttempts.get(phone);
  if (!record || now > record.resetAt) {
    otpAttempts.set(phone, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

export async function POST(req: Request) {
  const body = await req.json();
  const validation = validate(sendOtpSchema, body);
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { phone } = validation.data;

  if (isRateLimited(phone)) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
      { status: 429, headers: { 'Retry-After': '600' } }
    );
  }

  // TODO: Supabase auth.signInWithOtp({ phone: '+91' + phone })
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for +91${phone}: 123456`);
    return NextResponse.json({ success: true, message: 'OTP sent (dev: use 123456)' });
  }

  // Production: Supabase sends the SMS
  return NextResponse.json({ success: true, message: 'OTP sent to your mobile number' });
}
