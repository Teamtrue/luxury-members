import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount, booking_ref, member_id } = await req.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Dev / test mode: return mock order without hitting Razorpay
  if (!process.env.RAZORPAY_KEY_ID || process.env.NODE_ENV !== 'production') {
    return NextResponse.json({
      id: 'order_mock_' + Date.now(),
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: booking_ref ?? 'BK-' + Date.now(),
      status: 'created',
    });
  }

  // Production: use Razorpay SDK
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: booking_ref ?? `BK-${member_id}-${Date.now()}`,
    });
    return NextResponse.json(order);
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
  }
}
