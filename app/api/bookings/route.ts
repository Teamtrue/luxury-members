import { NextResponse } from 'next/server';
import { MOCK_BOOKINGS, MOCK_MEMBER, MOCK_DEALS } from '@/lib/mock-data';
import { tokensEarned } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  // TODO: get member_id from Supabase session
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // const { data } = await supabase.from('bookings').select('*').eq('member_id', user.id);
  const bookings = status
    ? MOCK_BOOKINGS.filter((b) => b.status === status)
    : MOCK_BOOKINGS;
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { deal_id, tokens_used = 0, payment_method, delivery_address } = body;

  if (!deal_id || !delivery_address) {
    return NextResponse.json({ error: 'deal_id and delivery_address are required' }, { status: 400 });
  }

  const deal = MOCK_DEALS.find((d) => d.id === deal_id) ?? MOCK_DEALS[0];

  // Calculate amounts
  const tokenDiscount = tokens_used * 0.5; // 1 PC Token = ₹0.50
  const amountPaid = Math.round(deal.club_price * 1.18 - tokenDiscount); // club price + GST - token discount
  const earned = tokensEarned(amountPaid, MOCK_MEMBER.tier);

  // TODO: persist to Supabase, create Razorpay order
  const newBooking = {
    id: 'BK-' + String(Date.now()).slice(-6),
    member_id: MOCK_MEMBER.id,
    deal_id,
    deal_title: deal.title,
    deal_category: deal.category,
    amount_paid: amountPaid,
    tokens_used,
    tokens_earned: earned,
    payment_method,
    status: 'pending_payment',
    delivery_address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(newBooking, { status: 201 });
}
