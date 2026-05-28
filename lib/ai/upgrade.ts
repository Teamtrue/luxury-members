/**
 * lib/ai/upgrade.ts
 *
 * Logistic-regression upgrade propensity scoring.
 * Identifies Silver/Gold members most likely to upgrade if offered a promotion.
 *
 * Exports:
 *   scoreUpgradePropensity  — synchronous, given pre-fetched signals
 *   identifyUpgradeCandidates — async batch query from DB
 */

export interface UpgradeSignals {
  member_id: string;
  current_tier: 'silver' | 'gold' | 'platinum';
  target_tier: 'gold' | 'platinum' | 'obsidian';
  days_since_join: number;
  total_spend_paise: number;
  spend_last_90_days_paise: number;
  deal_denials_last_30_days: number;
  categories_accessed: string[];
  referrals_sent: number;
  token_earn_rate_90d: number;
  membership_expires_in_days: number;
}

export interface UpgradeScore {
  member_id: string;
  current_tier: string;
  target_tier: string;
  upgrade_probability: number;
  propensity_level: 'low' | 'medium' | 'high';
  top_signals: string[];
  recommended_offer: {
    type: 'discount_first_month' | 'bonus_tokens' | 'extended_trial' | 'none';
    value: number;
    valid_days: number;
  };
  scored_at: string;
}

// Median spend thresholds per tier (paise) for the "high spender" signal.
const TIER_MEDIAN_SPEND_90D: Record<string, number> = {
  silver: 500_000,   // ₹5,000
  gold: 1_500_000,   // ₹15,000
  platinum: 5_000_000, // ₹50,000
};

export function scoreUpgradePropensity(signals: UpgradeSignals): UpgradeScore {
  let score = 0;
  const top_signals: string[] = [];

  // Strong positive: deal denials (member tried a higher-tier deal).
  const denialBoost = Math.min(signals.deal_denials_last_30_days, 3) * 0.3;
  if (denialBoost > 0) {
    score += denialBoost;
    top_signals.push(`deal_denials_${signals.deal_denials_last_30_days}`);
  }

  // High spend relative to tier median.
  const medianSpend = TIER_MEDIAN_SPEND_90D[signals.current_tier] ?? 500_000;
  if (signals.spend_last_90_days_paise > medianSpend) {
    score += 0.25;
    top_signals.push('high_spend_rate');
  }

  // Renewal window — membership renewal ≈ upgrade opportunity.
  if (signals.membership_expires_in_days < 30) {
    score += 0.15;
    top_signals.push('renewal_window');
  }

  // Active referrer — engaged member.
  if (signals.referrals_sent > 2) {
    score += 0.1;
    top_signals.push('active_referrer');
  }

  // Token activity signals engagement.
  if (signals.token_earn_rate_90d > 10) {
    score += 0.05;
    top_signals.push('token_active');
  }

  // Negative signals.
  if (signals.total_spend_paise < 200_000) {
    score -= 0.2;
  }
  if (signals.days_since_join < 30) {
    score -= 0.1;
  }

  const upgrade_probability = Math.max(0, Math.min(1, score));

  let propensity_level: UpgradeScore['propensity_level'];
  if (upgrade_probability >= 0.6) propensity_level = 'high';
  else if (upgrade_probability >= 0.35) propensity_level = 'medium';
  else propensity_level = 'low';

  // Recommended offer based on propensity level.
  let recommended_offer: UpgradeScore['recommended_offer'];
  if (propensity_level === 'high') {
    recommended_offer = { type: 'discount_first_month', value: 500, valid_days: 7 };
  } else if (propensity_level === 'medium') {
    recommended_offer = { type: 'bonus_tokens', value: 250, valid_days: 14 };
  } else {
    recommended_offer = { type: 'none', value: 0, valid_days: 0 };
  }

  return {
    member_id: signals.member_id,
    current_tier: signals.current_tier,
    target_tier: signals.target_tier,
    upgrade_probability,
    propensity_level,
    top_signals: top_signals.slice(0, 4),
    recommended_offer,
    scored_at: new Date().toISOString(),
  };
}

/**
 * Batch-score all members of a given tier for upgrade propensity.
 * Returns members with upgrade_probability > 0.35, sorted descending.
 */
export async function identifyUpgradeCandidates(
  tier: 'silver' | 'gold' | 'platinum'
): Promise<UpgradeScore[]> {
  const { createServiceRoleClient } = await import('@/lib/supabase/service');
  const db = createServiceRoleClient();

  const targetTier: Record<string, 'gold' | 'platinum' | 'obsidian'> = {
    silver: 'gold',
    gold: 'platinum',
    platinum: 'obsidian',
  };

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch active members of this tier with their join date.
  const { data: members } = await db
    .from('memberships')
    .select(`
      user_id,
      started_at,
      expires_at,
      membership_plans ( slug )
    `)
    .eq('status', 'active')
    .eq('membership_plans.slug', tier);

  if (!members || members.length === 0) return [];

  const scores: UpgradeScore[] = [];

  for (const ms of members) {
    const m = ms as Record<string, unknown>;
    const userId = m.user_id as string;
    const startedAt = m.started_at as string | null;
    const expiresAt = m.expires_at as string | null;

    const daysSinceJoin = startedAt
      ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 86_400_000)
      : 0;
    const expiresInDays = expiresAt
      ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
      : 0;

    const [bookings90d, bookings30d, referrals, tokens90d] = await Promise.all([
      db.from('bookings').select('total_paise').eq('user_id', userId).gte('created_at', ninetyDaysAgo).eq('status', 'confirmed'),
      db.from('bookings').select('id').eq('user_id', userId).gte('created_at', thirtyDaysAgo).eq('status', 'cancelled').ilike('cancellation_reason', '%tier%'),
      db.from('referrals').select('id').eq('referrer_id', userId),
      db.from('token_transactions').select('amount, created_at').eq('user_id', userId).gte('created_at', ninetyDaysAgo).gt('amount', 0),
    ]);

    const spend90d = ((bookings90d.data ?? []) as { total_paise: number }[])
      .reduce((s, b) => s + b.total_paise, 0);

    const tokenTxns = (tokens90d.data ?? []) as { amount: number }[];
    const tokenEarnRate = tokenTxns.length > 0
      ? tokenTxns.reduce((s, t) => s + t.amount, 0) / 90
      : 0;

    const upgradeScore = scoreUpgradePropensity({
      member_id: userId,
      current_tier: tier,
      target_tier: targetTier[tier],
      days_since_join: daysSinceJoin,
      total_spend_paise: spend90d,
      spend_last_90_days_paise: spend90d,
      deal_denials_last_30_days: (bookings30d.data ?? []).length,
      categories_accessed: [],
      referrals_sent: (referrals.data ?? []).length,
      token_earn_rate_90d: tokenEarnRate,
      membership_expires_in_days: expiresInDays,
    });

    if (upgradeScore.upgrade_probability > 0.35) {
      scores.push(upgradeScore);
    }
  }

  return scores.sort((a, b) => b.upgrade_probability - a.upgrade_probability);
}
