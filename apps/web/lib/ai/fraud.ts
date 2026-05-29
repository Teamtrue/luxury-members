/**
 * Fraud scoring — rule-based synchronous scoring for payment orders.
 * Called from POST /api/payments/create-order before creating a Razorpay order.
 * Must complete in <50ms (no I/O).
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
  const rules: string[] = [];

  // Hard block rules
  if (signals.same_ip_different_members > 5) {
    rules.push('ip_shared_many_accounts');
    score = 100;
  }
  if (signals.member_age_days < 1 && signals.amount_paise > 100_000) {
    rules.push('new_account_high_value');
    score = 100;
  }
  if (signals.bookings_last_24h > 10) {
    rules.push('excessive_bookings_24h');
    score = 100;
  }

  // High-risk signals
  if (score < 100) {
    if (signals.tokens_used_pct > 0.8) {
      rules.push('high_token_redemption_pct');
      score += 25;
    }
    if (signals.member_age_days < 7 && signals.amount_paise > 500_000) {
      rules.push('new_account_very_high_value');
      score += 30;
    }
    if (signals.is_new_delivery_address && signals.amount_paise > 200_000) {
      rules.push('new_address_high_value');
      score += 20;
    }
    if (signals.same_ip_different_members > 2) {
      rules.push('ip_shared_multiple_accounts');
      score += 20;
    }
    if (signals.bookings_last_24h > 5) {
      rules.push('many_bookings_24h');
      score += 15;
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

  return {
    risk_score: score,
    risk_level,
    triggered_rules: rules,
    action,
    ...(action === 'block' ? { reason: 'This transaction could not be processed. Please contact support.' } : {}),
  };
}
