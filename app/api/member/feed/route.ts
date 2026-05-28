/**
 * GET /api/member/feed
 * ---------------------------------------------------------------------------
 * Personalised deal feed for authenticated members.
 *
 * Re-ranks all accessible deals using the linear scoring model in
 * lib/ai/recommendations.ts. Returns paginated results with rank signals.
 *
 * Falls back to created_at descending if the member has no booking history.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { createServiceRoleClient }  from '@/lib/supabase/service';
import { buildCategoryAffinity, scoreDealForMember } from '@/lib/ai/recommendations';

const TIER_RANK: Record<string, number> = { silver: 1, gold: 2, platinum: 3, obsidian: 4 };

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const url = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
  const category = url.searchParams.get('category') ?? '';
  const offset = (page - 1) * limit;

  const db = createServiceRoleClient();

  try {
    // Get member's active tier.
    const { data: membership } = await db
      .from('memberships')
      .select('membership_plans ( slug )')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const plan = membership
      ? ((membership as Record<string, unknown>).membership_plans as Record<string, unknown> | null)
      : null;
    const memberTier = (Array.isArray(plan) ? plan[0]?.slug : plan?.slug) as string ?? 'silver';
    const memberTierRank = TIER_RANK[memberTier] ?? 1;

    // Fetch all active deals in parallel with booking history.
    const [dealsResult, bookingsResult] = await Promise.all([
      db
        .from('deals')
        .select('id, title, category, brand, club_price_paise, retail_price_paise, savings_pct, min_tier, valid_until, current_bookings, max_bookings, image_url, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(500), // Fetch generously for in-memory ranking.
      db
        .from('bookings')
        .select('deals ( category ), created_at')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (dealsResult.error) {
      console.error('[GET /api/member/feed] Deals query error:', dealsResult.error.message);
      return apiError('Failed to fetch deals.', 500);
    }

    const allDeals = (dealsResult.data ?? []) as Record<string, unknown>[];
    const bookingRows = (bookingsResult.data ?? []) as Record<string, unknown>[];

    // Build category affinity from booking history.
    const bookingHistory = bookingRows.map(b => {
      const deal = b.deals as Record<string, unknown> | null;
      return { category: (deal?.category as string) ?? '' };
    }).filter(b => b.category);

    const categoryCounts = buildCategoryAffinity(bookingHistory, []);

    const now = Date.now();

    // Filter, score, and rank deals.
    const scored = allDeals
      .filter(d => {
        // Tier access check.
        const dealTierRank = TIER_RANK[d.min_tier as string] ?? 1;
        if (dealTierRank > memberTierRank) return false;
        // Category filter.
        if (category && d.category !== category) return false;
        return true;
      })
      .map(d => {
        const expiresAt = d.valid_until as string | null;
        const daysUntilExpiry = expiresAt
          ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 86_400_000))
          : 365;
        const clubPricePaise = d.club_price_paise as number ?? 0;
        const retailPricePaise = d.retail_price_paise as number ?? 0;
        const savingsPct = (d.savings_pct as number | null) ?? (retailPricePaise > 0
          ? Math.round(((retailPricePaise - clubPricePaise) / retailPricePaise) * 100)
          : 0);
        const currentBookings = d.current_bookings as number ?? 0;
        const maxBookings = d.max_bookings as number | null;
        const velocity = maxBookings ? Math.floor((currentBookings / maxBookings) * 50) : 0;

        const score = scoreDealForMember(
          {
            id: d.id as string,
            category: d.category as string,
            savings_pct: savingsPct,
            days_until_expiry: daysUntilExpiry,
            bookings_velocity: velocity,
            min_tier: d.min_tier as string,
          },
          categoryCounts,
          memberTier
        );

        return {
          ...d,
          _rank_score: score,
          savings_pct: savingsPct,
          days_until_expiry: daysUntilExpiry,
        };
      })
      .sort((a, b) => b._rank_score - a._rank_score);

    const total = scored.length;
    const page_deals = scored.slice(offset, offset + limit).map(d => {
      const { _rank_score, ...rest } = d;
      return { ...rest, rank_score: Math.round(_rank_score * 1000) / 1000 };
    });

    return apiSuccess({
      deals: page_deals,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      model: 'popular',
      personalised: bookingHistory.length > 0,
    });

  } catch (err) {
    console.error('[GET /api/member/feed] Unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
