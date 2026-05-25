import { NextResponse } from 'next/server';
import { MOCK_TOKEN_TXNS } from '@/lib/mock-data';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // earned | redeemed | bonus
  const limit = parseInt(searchParams.get('limit') ?? '50');

  // TODO: get member from Supabase session
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // const { data } = await supabase.from('token_transactions')
  //   .select('*').eq('member_id', user.id).order('created_at', { ascending: false }).limit(limit);

  let txns = MOCK_TOKEN_TXNS;
  if (type) txns = txns.filter((t) => t.type === type);
  return NextResponse.json(txns.slice(0, limit));
}

export async function POST(req: Request) {
  const { type, amount, description, reference } = await req.json();

  if (!type || !amount || !description) {
    return NextResponse.json({ error: 'type, amount, description are required' }, { status: 400 });
  }

  // TODO: validate member from session, insert transaction, update member.token_balance
  const txn = {
    id: 't' + Date.now(),
    member_id: 'MOCK_MEMBER_ID',
    type,
    amount: type === 'redeemed' ? -Math.abs(amount) : Math.abs(amount),
    description,
    reference,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json(txn, { status: 201 });
}
