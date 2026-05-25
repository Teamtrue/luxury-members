import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string' || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits.' }, { status: 400 });
    }

    // TODO: Integrate Supabase Auth OTP
    // const { createClient } = await import('@/lib/supabase/server');
    // const supabase = createClient();
    // const { error } = await supabase.auth.signInWithOtp({
    //   phone: '+91' + phone,
    //   options: { channel: 'sms' },
    // });
    // if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Dev mode: always succeed without sending a real OTP
    console.log(`[DEV] OTP requested for +91${phone}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent',
      // In dev, expose the test OTP so the frontend can autofill:
      ...(process.env.NODE_ENV !== 'production' && { devOtp: '123456' }),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
