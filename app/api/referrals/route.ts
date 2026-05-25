import { NextResponse } from 'next/server';
import { MOCK_REFERRALS, MOCK_MEMBER } from '@/lib/mock-data';

export async function GET() {
  // TODO: get member_id from Supabase session
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // const { data } = await supabase.from('referrals')
  //   .select('*, referee:members!referee_id(name, tier, status)')
  //   .eq('referrer_id', user.id).order('created_at', { ascending: false });

  const stats = {
    total: MOCK_REFERRALS.length,
    active: MOCK_REFERRALS.filter((r) => r.status === 'active').length,
    trail_commission_earned: MOCK_REFERRALS.reduce((s, r) => s + r.trail_commission_earned, 0),
    token_bonuses: MOCK_REFERRALS.reduce((s, r) => s + r.token_bonus, 0),
    referral_code: MOCK_MEMBER.referral_code,
  };

  return NextResponse.json({ stats, referrals: MOCK_REFERRALS });
}
