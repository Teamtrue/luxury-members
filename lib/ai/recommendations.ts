/**
 * lib/ai/recommendations.ts
 *
 * Phase 1: popularity-based deal ranking using booking history signals.
 * Phase 2 (future): item-item collaborative filtering.
 *
 * Core exports:
 *   buildCategoryAffinity  — derive affinity map from booking history
 *   scoreDealForMember     — linear ranking score for one deal (used in feed route)
 *   getRecommendedDeals    — full recommendation result (for standalone calls)
 */

export interface RecommendationInput {
  member_id: string;
  tier: 'silver' | 'gold' | 'platinum' | 'obsidian';
  booking_history: {
    deal_id: string;
    category: string;
    amount_paid: number;
    created_at: string;
  }[];
  category_preferences: string[];
  limit: number;
}

export interface RecommendedDeal {
  deal_id: string;
  score: number;
  reason: string;
  model_version: string;
}

export interface RecommendationResult {
  recommendations: RecommendedDeal[];
  fallback: boolean;
  model: 'collaborative' | 'content_based' | 'hybrid' | 'popular';
  generated_at: string;
}

const TIER_ORDER: Record<string, number> = { silver: 0, gold: 1, platinum: 2, obsidian: 3 };
const MODEL_VERSION = '1.0.0-popular';

/**
 * Build a category affinity map from booking history and explicit preferences.
 * Bookings count as 1.0 per occurrence; preferences count as 0.5 (softer signal).
 */
export function buildCategoryAffinity(
  bookingHistory: { category: string }[],
  categoryPreferences: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of bookingHistory) {
    counts[b.category] = (counts[b.category] ?? 0) + 1;
  }
  for (const cat of categoryPreferences) {
    counts[cat] = (counts[cat] ?? 0) + 0.5;
  }
  return counts;
}

/**
 * Score a single deal for a member.
 * Returns a number in [0, 1] — higher is more relevant.
 *
 * Weights (must sum to 1.0):
 *   category affinity  0.40
 *   savings boost      0.25
 *   urgency boost      0.20
 *   velocity boost     0.15
 */
export function scoreDealForMember(
  deal: {
    id: string;
    category: string;
    savings_pct: number;
    days_until_expiry: number;
    bookings_velocity: number;
    min_tier: string;
  },
  categoryCounts: Record<string, number>,
  memberTier: string
): number {
  const maxCount = Math.max(1, ...Object.values(categoryCounts));
  const affinity = (categoryCounts[deal.category] ?? 0) / maxCount;

  // Small bonus for deals well below the member's tier (easy win).
  const tierDiff = (TIER_ORDER[memberTier] ?? 0) - (TIER_ORDER[deal.min_tier] ?? 0);
  const tierBonus = tierDiff >= 2 ? 0.05 : 0;

  // Urgency: linear boost for deals expiring within 7 days.
  const urgencyBoost =
    deal.days_until_expiry > 0 && deal.days_until_expiry <= 7
      ? 0.2 * (1 - deal.days_until_expiry / 7)
      : 0;

  const savingsBoost = Math.min(1, (deal.savings_pct ?? 0) / 100) * 0.25;
  const velocityBoost = Math.min(1, (deal.bookings_velocity ?? 0) / 50) * 0.15;

  return Math.min(1, affinity * 0.4 + tierBonus + urgencyBoost + savingsBoost + velocityBoost);
}

/**
 * Full recommendation pipeline.
 * For now returns metadata only; actual deal fetching + scoring is done
 * inline in the feed route for efficiency.
 */
export async function getRecommendedDeals(
  input: RecommendationInput
): Promise<RecommendationResult> {
  const categoryCounts = buildCategoryAffinity(
    input.booking_history,
    input.category_preferences
  );

  const fallback = Object.keys(categoryCounts).length === 0;

  return {
    recommendations: [],
    fallback,
    model: 'popular',
    generated_at: new Date().toISOString(),
  };
}

export { MODEL_VERSION };
