/**
 * GET /api/referrals
 * ---------------------------------------------------------------------------
 * Returns the authenticated member's referral dashboard data:
 *   - Their referral code
 *   - Summary stats (total referrals, active referrals, commission earned, bonuses)
 *   - Full list of referral records with referee details
 *
 * Uses service role to join referrals → user_profiles for referee names.
 * ---------------------------------------------------------------------------
 */

import { requireAuth, apiSuccess, apiError, getPagination } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const { limit, offset, page } = getPagination(searchParams);

  const db = createServiceRoleClient();

  try {
    // 1. Get member's active membership for referral_code.
    const { data: membership, error: membershipError } = await db
      .from('memberships')
      .select('referral_code, membership_plans ( slug )')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membershipError) {
      console.error('[GET /api/referrals] Membership query error:', membershipError.message);
      return apiError('Failed to load referral data.', 500);
    }

    const referralCode = membership?.referral_code ?? null;

    // 2. Fetch referrals where caller is the referrer.
    const { data: referrals, error: referralError, count } = await db
      .from('referrals')
      .select(
        `
          id,
          referee_user_id,
          referral_code,
          status,
          referrer_token_bonus,
          referee_token_bonus,
          trail_commission_rate_pct,
          trail_commission_earned_paise,
          activated_at,
          expires_at,
          created_at,
          referee:user_profiles!referrals_referee_user_id_fkey (
            id,
            full_name,
            phone
          ),
          referee_membership:memberships!referrals_referee_user_id_fkey (
            status,
            membership_plans ( slug, name )
          )
        `,
        { count: 'exact' }
      )
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (referralError) {
      console.error('[GET /api/referrals] Referrals query error:', referralError.message);
      return apiError('Failed to load referrals.', 500);
    }

    const allReferrals = referrals ?? [];

    // 3. Compute summary stats.
    // Fetch ALL referrals (no pagination) for accurate aggregate stats.
    const { data: allReferralRows } = await db
      .from('referrals')
      .select('status, trail_commission_earned_paise, referrer_token_bonus, activated_at')
      .eq('referrer_user_id', user.id);

    const rows = allReferralRows ?? [];
    const stats = {
      total:                    rows.length,
      active:                   rows.filter((r) => r.status === 'activated' || r.status === 'rewarded').length,
      pending:                  rows.filter((r) => r.status === 'pending').length,
      trail_commission_earned_paise: rows.reduce(
        (sum, r) => sum + (r.trail_commission_earned_paise as number ?? 0),
        0
      ),
      token_bonuses:            rows.reduce(
        (sum, r) => sum + (r.referrer_token_bonus as number ?? 0),
        0
      ),
    };

    // 4. Format referral list.
    const formattedReferrals = allReferrals.map((r) => {
      const ref = r as Record<string, unknown>;
      const refereeProfile = Array.isArray(ref.referee)
        ? ref.referee[0]
        : ref.referee;
      const refereeMemberships = Array.isArray(ref.referee_membership)
        ? ref.referee_membership
        : [ref.referee_membership];
      const refereeMembership = refereeMemberships[0] as Record<string, unknown> | null;
      const refereePlans = refereeMembership
        ? (Array.isArray(refereeMembership.membership_plans)
            ? refereeMembership.membership_plans
            : [refereeMembership.membership_plans])
        : [];
      const refereePlan = refereePlans[0] as Record<string, unknown> | null;

      return {
        id:                            ref.id,
        status:                        ref.status,
        referral_code:                 ref.referral_code,
        trail_commission_rate_pct:     ref.trail_commission_rate_pct,
        trail_commission_earned_paise: ref.trail_commission_earned_paise,
        token_bonus:                   ref.referrer_token_bonus,
        activated_at:                  ref.activated_at,
        expires_at:                    ref.expires_at,
        created_at:                    ref.created_at,
        referee: refereeProfile
          ? {
              id:        (refereeProfile as Record<string, unknown>).id,
              full_name: (refereeProfile as Record<string, unknown>).full_name,
              // Mask phone for privacy: show only last 4 digits.
              phone:     maskPhone((refereeProfile as Record<string, unknown>).phone as string | null),
              tier:      refereePlan?.slug ?? null,
              tier_name: refereePlan?.name ?? null,
              membership_status: refereeMembership?.status ?? null,
            }
          : null,
      };
    });

    // Upgrade propensity — synchronous scoring added to response, non-fatal.
    let upgrade_hint: Record<string, unknown> | null = null;
    try {
      const ms   = membership as Record<string, unknown> | null;
      const mPlan = ms?.membership_plans as Record<string, unknown> | null;
      const currentTier = (Array.isArray(mPlan) ? mPlan[0]?.slug : mPlan?.slug) as string ?? 'silver';
      const tierNext: Record<string, string> = { silver: 'gold', gold: 'platinum', platinum: 'obsidian' };
      const targetTier  = tierNext[currentTier];

      if (targetTier) {
        const { scoreUpgradePropensity } = await import('@/lib/ai/upgrade');
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [spendAll, spend90d, userProf, activeMem, earnedTokens90d, denialLogs] = await Promise.all([
          db.from('bookings').select('total_paise').eq('user_id', user.id).eq('status', 'confirmed'),
          db.from('bookings').select('total_paise, deals ( category )').eq('user_id', user.id).eq('status', 'confirmed').gte('created_at', ninetyDaysAgo),
          db.from('user_profiles').select('created_at').eq('id', user.id).maybeSingle(),
          db.from('memberships').select('expires_at').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
          db.from('token_transactions').select('amount').eq('user_id', user.id).eq('type', 'earned').gte('created_at', ninetyDaysAgo),
          db.from('audit_logs').select('id').eq('actor_id', user.id).eq('action', 'deal.access_denied').gte('created_at', thirtyDaysAgo),
        ]);

        const memberCreatedAt    = (userProf.data as Record<string, unknown> | null)?.created_at as string | null;
        const daysSinceJoin      = memberCreatedAt
          ? Math.floor((Date.now() - new Date(memberCreatedAt).getTime()) / 86_400_000)
          : 0;
        const totalSpend         = (spendAll.data ?? []).reduce((s: number, b: { total_paise: number }) => s + b.total_paise, 0);
        const spend90dTotal      = (spend90d.data ?? []).reduce((s: number, b: { total_paise: number }) => s + b.total_paise, 0);
        const categories90d: string[] = [];
        for (const b of spend90d.data ?? []) {
          const deal = Array.isArray((b as Record<string, unknown>).deals)
            ? ((b as Record<string, unknown>).deals as Array<{ category: string }>)[0]
            : (b as Record<string, unknown>).deals as { category: string } | null;
          if (deal?.category) categories90d.push(deal.category);
        }
        const expiresAt          = (activeMem.data as Record<string, unknown> | null)?.expires_at as string | null;
        const membershipDays     = expiresAt
          ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
          : 365;
        const tokenEarn90d       = (earnedTokens90d.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0);

        const upgradeScore = scoreUpgradePropensity({
          member_id:                  user.id,
          current_tier:               currentTier as 'silver' | 'gold' | 'platinum',
          target_tier:                targetTier  as 'gold' | 'platinum' | 'obsidian',
          days_since_join:            daysSinceJoin,
          total_spend_paise:          totalSpend,
          spend_last_90_days_paise:   spend90dTotal,
          deal_denials_last_30_days:  (denialLogs.data ?? []).length,
          categories_accessed:        [...new Set(categories90d)],
          referrals_sent:             stats.total,
          token_earn_rate_90d:        tokenEarn90d,
          membership_expires_in_days: membershipDays,
        });

        upgrade_hint = {
          eligible:            true,
          current_tier:        upgradeScore.current_tier,
          target_tier:         upgradeScore.target_tier,
          probability:         upgradeScore.upgrade_probability,
          level:               upgradeScore.propensity_level,
          top_signals:         upgradeScore.top_signals,
          recommended_offer:   upgradeScore.recommended_offer,
        };
      }
    } catch { /* non-fatal — upgrade hint is advisory only */ }

    return apiSuccess({
      referral_code: referralCode,
      stats,
      referrals:     formattedReferrals,
      total:         count ?? 0,
      page,
      limit,
      pages:         Math.ceil((count ?? 0) / limit),
      upgrade_hint,
    });

  } catch (err) {
    console.error('[GET /api/referrals] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  // Keep country code + first few digits, mask middle, show last 4.
  // e.g. +919876543210 → +91 98*** ***3210
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '***masked***';
  return '****' + digits.slice(-4);
}
