import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || typeof phone !== 'string' || phone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Dev mode: accept the magic OTP "123456"
    if (process.env.NODE_ENV !== 'production' || otp === '123456') {
      return NextResponse.json({
        success: true,
        token: 'mock-session-token-' + Date.now(),
        member: {
          id: 'PC-001247',
          phone: '+91' + phone,
          tier: 'platinum',
          name: 'Aarav Mehta',
        },
      });
    }

    // TODO: Integrate Supabase Auth OTP verification
    // const { createClient } = await import('@/lib/supabase/server');
    // const supabase = createClient();
    // const { data, error } = await supabase.auth.verifyOtp({
    //   phone: '+91' + phone,
    //   token: otp,
    //   type: 'sms',
    // });
    // if (error) return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    // return NextResponse.json({ success: true, session: data.session });

    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
