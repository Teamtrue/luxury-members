/**
 * Churn prediction — logistic regression scoring for membership renewal risk.
 * Called from the membership lifecycle cron (POST /api/internal/membership/lifecycle).
 */

export interface ChurnSignals {
  member_id: string;
  tier: string;
  membership_expires_at: string;
  days_since_last_booking: number;
  total_bookings_lifetime: number;
  total_bookings_last_90_days: number;
  token_balance: number;
  tokens_earned_last_90_days: number;
  referrals_active: number;
  days_until_expiry: number;
  has_concierge_request: boolean;
}

export interface ChurnScore {
  member_id: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  top_signals: string[];
  recommended_action: 'none' | 'email_nudge' | 'win_back_offer' | 'personal_outreach';
  scored_at: string;
}

export function scoreChurnRisk(signals: ChurnSignals): ChurnScore {
  let score = 0.15; // base rate
  const top_signals: string[] = [];

  const daysCapped = Math.min(signals.days_since_last_booking, 90);
  score += daysCapped * 0.003;
  if (signals.days_since_last_booking > 60) top_signals.push('no_booking_60d');

  if (signals.total_bookings_last_90_days === 0) {
    score += 0.4;
    top_signals.push('zero_bookings_90d');
  }

  if (signals.days_until_expiry < 30) {
    score += 0.2;
    top_signals.push('expiry_imminent');
  }

  if (signals.token_balance > 0) {
    score -= 0.1;
  } else {
    top_signals.push('no_token_balance');
  }

  if (signals.referrals_active > 0) {
    score -= 0.15;
  }

  if (signals.has_concierge_request) {
    score -= 0.1;
  }

  const churn_probability = Math.max(0, Math.min(1, score));

  let risk_level: ChurnScore['risk_level'];
  let recommended_action: ChurnScore['recommended_action'];

  if (churn_probability >= 0.75) {
    risk_level = 'critical';
    recommended_action = 'personal_outreach';
  } else if (churn_probability >= 0.5) {
    risk_level = 'high';
    recommended_action = 'win_back_offer';
  } else if (churn_probability >= 0.3) {
    risk_level = 'medium';
    recommended_action = 'email_nudge';
  } else {
    risk_level = 'low';
    recommended_action = 'none';
  }

  return {
    member_id: signals.member_id,
    churn_probability,
    risk_level,
    top_signals: top_signals.slice(0, 3),
    recommended_action,
    scored_at: new Date().toISOString(),
  };
}
