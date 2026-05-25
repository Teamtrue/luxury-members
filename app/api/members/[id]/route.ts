import { NextResponse } from 'next/server';
import { MOCK_MEMBERS } from '@/lib/mock-data';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // TODO: verify caller is the member themselves or an admin
  // const supabase = await createClient();
  // const { data } = await supabase.from('members').select('*').eq('id', params.id).single();
  const member = MOCK_MEMBERS.find((m) => m.id === params.id) ?? MOCK_MEMBERS[0];
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  // Allowed admin updates: tier, status, token_balance adjustment
  const allowed = ['tier', 'status', 'name', 'email'];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  // TODO: verify admin role, then:
  // const supabase = await createClient();
  // const { data } = await supabase.from('members').update(update).eq('id', params.id).select().single();

  return NextResponse.json({ id: params.id, ...update, updated: true });
}
