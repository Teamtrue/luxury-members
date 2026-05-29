/**
 * Upgrade propensity scoring — predicts which members are likely to upgrade tier.
 * Called from membership lifecycle cron and when a member hits a tier-gated deal.
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

const TIER_SPEND_MEDIANS: Record<string, number> = {
  silver:   50_000_00,  // ₹50,000 in paise
  gold:    200_000_00,
  platinum: 500_000_00,
};

export function scoreUpgradePropensity(signals: UpgradeSignals): UpgradeScore {
  let score = 0.1;
  const top_signals: string[] = [];

  const denialBoost = Math.min(signals.deal_denials_last_30_days, 3) * 0.3;
  score += denialBoost;
  if (signals.deal_denials_last_30_days > 0) top_signals.push(`deal_denials_${signals.deal_denials_last_30_days}`);

  const median = TIER_SPEND_MEDIANS[signals.current_tier] ?? 50_000_00;
  if (signals.spend_last_90_days_paise > median) {
    score += 0.25;
    top_signals.push('high_spend_rate');
  } else if (signals.total_spend_paise < median * 0.3) {
    score -= 0.2;
  }

  if (signals.membership_expires_in_days < 30) {
    score += 0.15;
    top_signals.push('renewal_window');
  }

  if (signals.referrals_sent > 2) {
    score += 0.1;
    top_signals.push('active_referrer');
  }

  if (signals.days_since_join < 30) {
    score -= 0.1;
  }

  const upgrade_probability = Math.max(0, Math.min(1, score));

  let propensity_level: UpgradeScore['propensity_level'];
  let offer_type: UpgradeScore['recommended_offer']['type'];
  let offer_value = 0;

  if (upgrade_probability >= 0.6) {
    propensity_level = 'high';
    offer_type = 'none';
  } else if (upgrade_probability >= 0.4) {
    propensity_level = 'medium';
    offer_type = 'bonus_tokens';
    offer_value = 500;
  } else {
    propensity_level = 'low';
    offer_type = signals.deal_denials_last_30_days > 0 ? 'discount_first_month' : 'none';
    offer_value = offer_type !== 'none' ? 500_00 : 0; // ₹500 off
  }

  return {
    member_id: signals.member_id,
    current_tier: signals.current_tier,
    target_tier: signals.target_tier,
    upgrade_probability,
    propensity_level,
    top_signals: top_signals.slice(0, 3),
    recommended_offer: {
      type: offer_type,
      value: offer_value,
      valid_days: 7,
    },
    scored_at: new Date().toISOString(),
  };
}
