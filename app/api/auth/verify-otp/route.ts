import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { phone, otp } = await req.json();
  if (!phone || !otp) return NextResponse.json({ error: 'phone and otp are required' }, { status: 400 });

  // Dev shortcut — never runs in production
  if (process.env.NODE_ENV === 'development' && otp === '123456') {
    return NextResponse.json({
      success: true,
      member: { id: 'PC-001247', name: 'Aarav Mehta', tier: 'platinum', role: 'member' },
    });
  }

  // Production: verify via Supabase
  // TODO: const supabase = await createClient();
  // TODO: const { data, error } = await supabase.auth.verifyOtp({ phone: '+91' + phone, token: otp, type: 'sms' });
  // TODO: if (error) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
  // TODO: return NextResponse.json({ success: true, user: data.user });

  // Temporary: until Supabase is wired up, reject in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Auth service not configured. Contact support.' }, { status: 503 });
  }

  return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
}
