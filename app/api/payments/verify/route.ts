import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  // Dev mode: skip signature verification
  const isValid =
    process.env.NODE_ENV !== 'production'
      ? true
      : verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  // TODO: update booking status in Supabase
  // const supabase = await createClient();
  // await supabase.from('bookings').update({
  //   status: 'confirmed',
  //   razorpay_order_id,
  //   razorpay_payment_id,
  // }).eq('id', booking_id);
  //
  // Credit PC tokens:
  // await supabase.from('token_transactions').insert({ member_id, type: 'earned', amount: tokensEarned, ... });
  // await supabase.from('members').update({ token_balance: supabase.rpc('increment', { x: tokensEarned }) }).eq('id', member_id);

  return NextResponse.json({ success: true, booking_id, status: 'confirmed' });
}
