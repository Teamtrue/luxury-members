/**
 * GET /api/admin/referrals — Admin referral leaderboard and commission ledger
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }            from '@/lib/supabase/service';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'referrals:read');
  if ('error' in auth) return auth.error;

  const db = createServiceRoleClient();

  try {
    // Top referrers with stats
    const { data: referrers, error: referrersError } = await db
      .from('referrals')
      .select(`
        referrer_id,
        status,
        commission_amount,
        user_profiles!referrer_id ( full_name, phone )
      `)
      .order('created_at', { ascending: false });

    if (referrersError) {
      console.error('[GET /api/admin/referrals] referrers error:', referrersError.message);
      return apiError('Failed to fetch referrals.', 500);
    }

    // Aggregate by referrer
    const referrerMap: Record<string, {
      referrer_id: string;
      name: string;
      phone: string;
      total: number;
      active: number;
      commission_paise: number;
    }> = {};

    for (const r of referrers ?? []) {
      const row = r as Record<string, unknown>;
      const rid = row.referrer_id as string;
      const profile = row.user_profiles as Record<string, string> | null;

      if (!referrerMap[rid]) {
        referrerMap[rid] = {
          referrer_id:      rid,
          name:             profile?.full_name ?? 'Unknown',
          phone:            profile?.phone ?? '',
          total:            0,
          active:           0,
          commission_paise: 0,
        };
      }

      referrerMap[rid].total++;
      if (row.status === 'active' || row.status === 'paid') referrerMap[rid].active++;
      referrerMap[rid].commission_paise += (row.commission_amount as number) ?? 0;
    }

    const leaderboard = Object.values(referrerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 50)
      .map((r, i) => ({ rank: i + 1, ...r }));

    // Recent referrals
    const { data: recent } = await db
      .from('referrals')
      .select(`
        id, status, commission_amount, created_at,
        user_profiles!referrer_id ( full_name ),
        referee:user_profiles!referee_id ( full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Summary stats
    const { count: totalReferrals } = await db
      .from('referrals')
      .select('id', { count: 'exact', head: true });

    const { data: commissionSum } = await db
      .from('referrals')
      .select('commission_amount')
      .eq('status', 'paid');

    const totalCommissionPaid = (commissionSum ?? []).reduce(
      (sum, r) => sum + ((r as Record<string, number>).commission_amount ?? 0),
      0
    );

    return apiSuccess({
      leaderboard,
      recent: recent ?? [],
      stats: {
        total_referrals:        totalReferrals ?? 0,
        total_commission_paid:  totalCommissionPaid,
      },
    });

  } catch (err) {
    console.error('[GET /api/admin/referrals] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
