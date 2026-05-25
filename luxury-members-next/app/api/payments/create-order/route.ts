import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  return NextResponse.json({
    orderId: `order_${crypto.randomUUID()}`,
    amount: body.amount,
    currency: 'INR'
  });
}
