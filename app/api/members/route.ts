import { NextResponse } from 'next/server';
import { MOCK_MEMBERS } from '@/lib/mock-data';
import { validate, memberSignupSchema } from '@/lib/validations';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier');
  const status = searchParams.get('status');
  const q = searchParams.get('q')?.toLowerCase() ?? '';

  // TODO: verify admin role from Supabase session
  // TODO: replace with Supabase query with RLS bypass via service role key

  let members = MOCK_MEMBERS;
  if (tier && tier !== 'all') members = members.filter((m) => m.tier === tier);
  if (status && status !== 'all') members = members.filter((m) => m.status === status);
  if (q) members = members.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));

  return NextResponse.json(members);
}

export async function POST(req: Request) {
  const body = await req.json();
  const validation = validate(memberSignupSchema, body);
  if ('error' in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, email, phone, tier, referred_by } = validation.data;

  // TODO: insert into Supabase members table, create token_transaction for welcome bonus
  const newMember = {
    id: 'PC-' + String(Math.floor(Math.random() * 900000) + 100000),
    name, email, phone, tier,
    status: 'pending',
    tokens: tier === 'silver' ? 200 : tier === 'gold' ? 400 : tier === 'platinum' ? 600 : 1000,
    joined: new Date().toISOString().split('T')[0],
    membership_expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    referral_code: name.split(' ')[0].toUpperCase() + String(Math.floor(Math.random() * 9000) + 1000),
    referred_by: referred_by ?? null,
  };

  return NextResponse.json(newMember, { status: 201 });
}
