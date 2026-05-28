/**
 * GET /api/admin/referrals
 * ---------------------------------------------------------------------------
 * Admin-only referral programme analytics:
 *   - Overall stats (totals, commission earned)
 *   - Top referrers (ranked by referral count)
 *   - Monthly breakdown (last 6 months)
 * ---------------------------------------------------------------------------
 */

import { requireAdmin, apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient }             from '@/lib/supabase/service';

interface ReferralRow {
  id:                            string;
  referrer_user_id:              string;
  status:                        string;
  trail_commission_earned_paise: number;
  activated_at:                  string | null;
  created_at:                    string;
  referrer: { id: string; full_name: string | null } | null;
}

interface MembershipRow {
  user_id:          string;
  slug:             string | null;
}

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdmin(request, 'referrals:read');
  if ('error' in auth) return auth.error;

  const db = createServiceRoleClient();

  try {
    // 1. Fetch all referrals with referrer profiles
    const { data: rawReferrals, error: refError } = await db
      .from('referrals')
      .select(`
        id,
        referrer_user_id,
        status,
        trail_commission_earned_paise,
        activated_at,
        created_at,
        referrer:user_profiles!referrals_referrer_user_id_fkey ( id, full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (refError) {
      console.error('[GET /api/admin/referrals]', refError.message);
      return apiError('Failed to load referral data.', 500);
    }

    const referrals = (rawReferrals ?? []) as unknown as ReferralRow[];

    // 2. Get tiers for the top referrer IDs via memberships → membership_plans
    const referrerIds = Array.from(new Set(referrals.map(r => r.referrer_user_id)));

    let memberTierMap: Record<string, string> = {};
    if (referrerIds.length > 0) {
      const { data: memberships } = await db
        .from('memberships')
        .select('user_id, membership_plans ( slug )')
        .in('user_id', referrerIds.slice(0, 500))
        .eq('status', 'active');

      if (memberships) {
        for (const m of memberships) {
          const ms = m as unknown as { user_id: string; membership_plans: { slug: string } | null };
          const slug = ms.membership_plans?.slug ?? 'silver';
          memberTierMap[ms.user_id] = slug;
        }
      }
    }

    // 3. Overall stats
    const totalReferrals    = referrals.length;
    const activeReferrals   = referrals.filter(r => r.status === 'activated' || r.status === 'rewarded').length;
    const totalCommPaise    = referrals.reduce((s, r) => s + (r.trail_commission_earned_paise ?? 0), 0);
    const avgPerMember      = referrerIds.length > 0
      ? Math.round((totalReferrals / referrerIds.length) * 10) / 10
      : 0;

    // 4. Top referrers (group by referrer_user_id)
    const referrerMap = new Map<string, {
      referrer_user_id: string;
      name:             string;
      tier:             string;
      total_referrals:  number;
      active_referrals: number;
      commission_paise: number;
    }>();

    for (const ref of referrals) {
      if (!referrerMap.has(ref.referrer_user_id)) {
        const profile = Array.isArray(ref.referrer) ? ref.referrer[0] : ref.referrer;
        referrerMap.set(ref.referrer_user_id, {
          referrer_user_id: ref.referrer_user_id,
          name:             profile?.full_name ?? 'Unknown',
          tier:             memberTierMap[ref.referrer_user_id] ?? 'silver',
          total_referrals:  0,
          active_referrals: 0,
          commission_paise: 0,
        });
      }
      const entry = referrerMap.get(ref.referrer_user_id)!;
      entry.total_referrals++;
      if (ref.status === 'activated' || ref.status === 'rewarded') entry.active_referrals++;
      entry.commission_paise += ref.trail_commission_earned_paise ?? 0;
    }

    const topReferrers = Array.from(referrerMap.values())
      .sort((a, b) => b.total_referrals - a.total_referrals)
      .slice(0, 10)
      .map((r, i) => ({ rank: i + 1, ...r }));

    // 5. Monthly breakdown (last 6 months)
    const monthMap = new Map<string, {
      month:            string;
      total_referrals:  number;
      activated:        number;
      commission_paise: number;
    }>();

    for (const ref of referrals) {
      const month = ref.created_at.slice(0, 7); // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, { month, total_referrals: 0, activated: 0, commission_paise: 0 });
      }
      const entry = monthMap.get(month)!;
      entry.total_referrals++;
      if (ref.status === 'activated' || ref.status === 'rewarded') entry.activated++;
      entry.commission_paise += ref.trail_commission_earned_paise ?? 0;
    }

    const monthlyBreakdown = Array.from(monthMap.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)
      .map(m => ({
        ...m,
        month_label: new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      }));

    return apiSuccess({
      stats: {
        total_referrals:     totalReferrals,
        active_referrals:    activeReferrals,
        total_commission_paise: totalCommPaise,
        avg_per_member:      avgPerMember,
      },
      top_referrers:     topReferrers,
      monthly_breakdown: monthlyBreakdown,
    });
  } catch (err) {
    console.error('[GET /api/admin/referrals] Unexpected error:', err);
    return apiError('Failed to load referral analytics.', 500);
  }
}
