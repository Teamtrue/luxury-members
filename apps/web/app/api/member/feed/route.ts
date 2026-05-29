/**
 * GET /api/member/feed — Personalized deal feed
 *
 * Returns a scored, paginated list of active deals personalized to the
 * authenticated member's booking history and tier.
 *
 * Scoring factors (linear combination):
 *   +0.4  category_affinity — deal category is in member's top 3 categories
 *   +0.3  savings_boost     — deal.savings_pct / 100 * 0.3
 *   +0.2  urgency           — deal expires within 7 days
 *   +0.1  tier_bonus        — deal.min_tier exactly matches member's tier
 *
 * Query params:
 *   page     (default 1)
 *   limit    (default 20, max 100)
 *   category (optional filter)
 */

import { requireAuth, apiSuccess, apiError, getPagination } from '@/lib/api-helpers';
import { createServiceRoleClient }                           from '@/lib/supabase/service';
import { tierOrder, canAccessDeal }                          from '@/lib/utils';
import type { Tier }                                         from '@/lib/types';

// ---------------------------------------------------------------------------
// GET /api/member/feed
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const { page, limit, offset } = getPagination(searchParams);
  const categoryFilter = searchParams.get('category') ?? null;

  const db = createServiceRoleClient();

  // -------------------------------------------------------------------------
  // 1. Resolve member's active tier from memberships → membership_plans
  // -------------------------------------------------------------------------
  const { data: membership, error: membershipError } = await db
    .from('memberships')
    .select('id, status, membership_plans ( slug )')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) {
    console.error('[GET /api/member/feed] membership query error:', membershipError.message);
    return apiError('Failed to verify membership.', 500);
  }

  const memberTier = resolvePlanSlug(membership?.membership_plans) as Tier;

  // -------------------------------------------------------------------------
  // 2. Fetch last 50 bookings (joined to deals) to build category affinity
  // -------------------------------------------------------------------------
  const { data: bookingRows, error: bookingsError } = await db
    .from('bookings')
    .select('deal_id, deals ( category ), amount_paid_paise, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (bookingsError) {
    console.error('[GET /api/member/feed] bookings query error:', bookingsError.message);
    // Non-fatal — degrade gracefully without personalisation
  }

  // Count category occurrences to find top 3.
  const categoryCounts: Record<string, number> = {};
  for (const row of bookingRows ?? []) {
    const cat = resolveDealCategory(row.deals);
    if (cat) {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    }
  }

  const top3Categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // -------------------------------------------------------------------------
  // 3. Fetch active deals accessible to the member's tier
  // -------------------------------------------------------------------------
  const now = new Date().toISOString();

  let dealsQuery = db
    .from('deals')
    .select(
      `
        id,
        title,
        category,
        brand,
        description,
        club_price_paise,
        retail_price_paise,
        savings_pct,
        min_tier,
        status,
        expires_at,
        max_bookings,
        current_bookings,
        tokens_earn_rate,
        image_url,
        created_at
      `,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .gt('expires_at', now);

  if (categoryFilter) {
    dealsQuery = dealsQuery.eq('category', categoryFilter);
  }

  const { data: dealsRaw, error: dealsError, count: totalDeals } = await dealsQuery;

  if (dealsError) {
    console.error('[GET /api/member/feed] deals query error:', dealsError.message);
    return apiError('Failed to fetch deals.', 500);
  }

  // -------------------------------------------------------------------------
  // 4. Filter out deals the member's tier cannot access, then score + sort
  // -------------------------------------------------------------------------
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

  type DealRow = Record<string, unknown>;

  const scoredDeals = (dealsRaw ?? [])
    .filter((deal: DealRow) => {
      const minTier = (deal.min_tier as Tier) ?? 'silver';
      return canAccessDeal(memberTier, minTier);
    })
    .map((deal: DealRow) => {
      let score = 0;

      // Category affinity bonus
      const cat = deal.category as string;
      if (top3Categories.includes(cat)) {
        score += 0.4;
      }

      // Savings boost
      const savingsPct = (deal.savings_pct as number) ?? 0;
      score += (savingsPct / 100) * 0.3;

      // Urgency bonus — expires within 7 days
      const expiresAt = new Date(deal.expires_at as string).getTime();
      if (expiresAt < sevenDaysFromNow) {
        score += 0.2;
      }

      // Tier bonus — min_tier matches member's current tier exactly
      if (deal.min_tier === memberTier) {
        score += 0.1;
      }

      return { ...deal, _score: score };
    })
    .sort((a, b) => b._score - a._score);

  // -------------------------------------------------------------------------
  // 5. Paginate the scored results
  // -------------------------------------------------------------------------
  const paginatedDeals = scoredDeals
    .slice(offset, offset + limit)
    .map(({ _score, ...deal }) => deal); // strip internal score field

  return apiSuccess({
    deals:         paginatedDeals,
    total:         scoredDeals.length,
    page,
    limit,
    personalized:  true,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the plan slug from a Supabase joined membership_plans value. */
function resolvePlanSlug(raw: unknown): string {
  if (!raw) return 'silver';
  const arr = Array.isArray(raw) ? raw : [raw];
  const plan = arr[0] as Record<string, unknown> | null;
  return (plan?.slug as string) ?? 'silver';
}

/** Resolve the deal category from a Supabase joined deals value. */
function resolveDealCategory(raw: unknown): string | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const deal = arr[0] as Record<string, unknown> | null;
  return (deal?.category as string) ?? null;
}
