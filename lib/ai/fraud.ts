/**
 * lib/ai/fraud.ts
 * Rule-based fraud scoring for payment orders. Runs synchronously in <5ms.
 * Block rules fire immediately; high-risk rules accumulate a score (0–100).
 */

export interface FraudSignals {
  member_id: string;
  ip_address: string;
  user_agent: string;
  amount_paise: number;
  deal_id: string;
  payment_method: string;
  member_age_days: number;
  lifetime_bookings: number;
  bookings_last_24h: number;
  tokens_used_pct: number;
  is_new_delivery_address: boolean;
  same_ip_different_members: number;
}

export interface FraudScore {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'block';
  triggered_rules: string[];
  action: 'allow' | 'flag' | 'block';
  reason?: string;
}

export function scoreFraudRisk(signals: FraudSignals): FraudScore {
  let score = 0;
  const triggered: string[] = [];

  // Block rules — any single rule triggers an immediate score=100 block.
  if (signals.same_ip_different_members > 5) {
    triggered.push('ip_shared_more_than_5_accounts');
    score = 100;
  }
  if (signals.member_age_days < 1 && signals.amount_paise > 100_000) {
    triggered.push('new_account_high_value_same_day');
    score = 100;
  }
  if (signals.bookings_last_24h > 10) {
    triggered.push('excessive_bookings_24h');
    score = 100;
  }

  if (score < 100) {
    // High-risk rules — accumulate score.
    if (signals.tokens_used_pct > 0.8 && signals.amount_paise > 500_000) {
      score += 30;
      triggered.push('high_token_pct_high_value');
    }
    if (signals.member_age_days < 7 && signals.amount_paise > 500_000) {
      score += 25;
      triggered.push('new_account_high_value');
    }
    if (signals.is_new_delivery_address && signals.amount_paise > 200_000) {
      score += 20;
      triggered.push('new_delivery_address_high_value');
    }
    if (signals.same_ip_different_members > 2) {
      score += 20;
      triggered.push('ip_shared_multiple_accounts');
    }
    if (signals.lifetime_bookings === 0 && signals.amount_paise > 1_000_000) {
      score += 15;
      triggered.push('first_booking_very_high_value');
    }
  }

  score = Math.min(100, score);

  let risk_level: FraudScore['risk_level'];
  let action: FraudScore['action'];

  if (score >= 100) {
    risk_level = 'block';
    action = 'block';
  } else if (score >= 70) {
    risk_level = 'high';
    action = 'flag';
  } else if (score >= 40) {
    risk_level = 'medium';
    action = 'flag';
  } else {
    risk_level = 'low';
    action = 'allow';
  }

  const result: FraudScore = { risk_score: score, risk_level, triggered_rules: triggered, action };
  if (action === 'block') {
    result.reason = 'Transaction blocked by security rules. Please contact support.';
  }
  return result;
}
