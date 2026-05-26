import { NextResponse } from 'next/server';
import { TIER_PRICES } from '@/lib/utils';
import { Tier } from '@/lib/types';

export async function POST(req: Request) {
  const { tier, member_id } = await req.json();

  if (!tier || !['silver', 'gold', 'platinum', 'obsidian'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const { total } = TIER_PRICES[tier as Tier];
  const receipt = `MEMB-${member_id ?? 'new'}-${Date.now()}`;

  // Dev / test mode: return mock order
  if (!process.env.RAZORPAY_KEY_ID || process.env.NODE_ENV !== 'production') {
    return NextResponse.json({
      id: 'order_mock_' + Date.now(),
      amount: total * 100, // paise
      currency: 'INR',
      receipt,
      tier,
      razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_mock',
    });
  }

  // Production: create Razorpay order
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await instance.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt,
      notes: { tier, member_id: member_id ?? 'new' },
    });
    return NextResponse.json({ ...order, tier, razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay membership order failed:', err);
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
  }
}
