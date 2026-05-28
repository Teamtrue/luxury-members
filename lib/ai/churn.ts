/**
 * lib/ai/churn.ts
 *
 * Logistic-regression churn prediction using behavioural signals.
 * Coefficients represent empirical weights; update quarterly from cohort data.
 *
 * Exports:
 *   scoreChurnRisk         — synchronous, given pre-fetched signals
 *   scoreAllAtRiskMembers  — async batch, fetches from DB and persists scores
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

// Base churn rate per tier — higher tiers are stickier.
const TIER_BASE: Record<string, number> = {
  silver: 0.05, gold: 0.03, platinum: 0.02, obsidian: 0.01,
};

export function scoreChurnRisk(signals: ChurnSignals): ChurnScore {
  let score = TIER_BASE[signals.tier] ?? 0.05;
  const top_signals: string[] = [];

  // Recency signal: 0.003 per day since last booking, capped at 90 days.
  const recencyDays = Math.min(signals.days_since_last_booking, 90);
  score += recencyDays * 0.003;
  if (recencyDays > 60) top_signals.push('no_booking_60d');
  else if (recencyDays > 30) top_signals.push('no_booking_30d');

  // Activity void in last 90 days.
  if (signals.total_bookings_last_90_days === 0) {
    score += 0.4;
    if (!top_signals.includes('no_booking_60d')) top_signals.push('zero_bookings_90d');
  }

  // Expiry proximity.
  if (signals.days_until_expiry < 30) {
    score += 0.2;
    top_signals.push('expiry_imminent');
  } else if (signals.days_until_expiry < 60) {
    score += 0.1;
    top_signals.push('expiry_approaching');
  }

  // Never booked.
  if (signals.total_bookings_lifetime === 0) {
    score += 0.2;
    top_signals.push('never_booked');
  }

  // Positive retention signals.
  if (signals.token_balance > 0) score -= 0.1;
  if (signals.tokens_earned_last_90_days > 0) {
    score -= 0.05;
    top_signals.push('token_activity');
  }
  if (signals.referrals_active > 0) {
    score -= 0.15;
    top_signals.push('active_referrer');
  }
  if (signals.has_concierge_request) score -= 0.1;

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
    top_signals: top_signals.slice(0, 4),
    recommended_action,
    scored_at: new Date().toISOString(),
  };
}

/**
 * Batch-score all members whose membership expires within 60 days.
 * Persists churn_score back to user_profiles.
 * Called by the membership lifecycle cron job.
 */
export async function scoreAllAtRiskMembers(): Promise<ChurnScore[]> {
  const { createServiceRoleClient } = await import('@/lib/supabase/service');
  const db = createServiceRoleClient();

  const sixtyDaysOut = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: memberships } = await db
    .from('memberships')
    .select(`
      user_id,
      expires_at,
      membership_plans ( slug )
    `)
    .eq('status', 'active')
    .lte('expires_at', sixtyDaysOut)
    .gte('expires_at', now);

  if (!memberships || memberships.length === 0) return [];

  const scores: ChurnScore[] = [];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  for (const ms of memberships) {
    const m = ms as Record<string, unknown>;
    const userId = m.user_id as string;
    const expiresAt = m.expires_at as string;
    const plan = (m.membership_plans as Record<string, unknown> | null);
    const tier = (Array.isArray(plan) ? plan[0]?.slug : plan?.slug) as string ?? 'silver';

    // Gather signals from DB.
    const [bookingsAll, bookings90d, tokenTxns, referrals, concierge] = await Promise.all([
      db.from('bookings').select('id, created_at').eq('user_id', userId).eq('status', 'confirmed'),
      db.from('bookings').select('id').eq('user_id', userId).eq('status', 'confirmed').gte('created_at', ninetyDaysAgo),
      db.from('token_transactions').select('amount, created_at').eq('user_id', userId),
      db.from('referrals').select('id').eq('referrer_id', userId).eq('status', 'active'),
      db.from('concierge_requests').select('id').eq('member_id', userId).limit(1),
    ]);

    const allBookings = (bookingsAll.data ?? []) as { created_at: string }[];
    const sortedDates = allBookings
      .map(b => new Date(b.created_at).getTime())
      .sort((a, b) => b - a);
    const lastBookingMs = sortedDates[0] ?? 0;
    const daysSinceLast = lastBookingMs
      ? Math.floor((Date.now() - lastBookingMs) / 86_400_000)
      : 999;

    const tokenRows = (tokenTxns.data ?? []) as { amount: number; created_at: string }[];
    const tokenBalance = tokenRows.reduce((s, r) => s + r.amount, 0);
    const tokens90d = tokenRows
      .filter(r => r.created_at >= ninetyDaysAgo && r.amount > 0)
      .reduce((s, r) => s + r.amount, 0);

    const daysUntilExpiry = Math.max(
      0,
      Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    );

    const churnScore = scoreChurnRisk({
      member_id: userId,
      tier,
      membership_expires_at: expiresAt,
      days_since_last_booking: daysSinceLast,
      total_bookings_lifetime: allBookings.length,
      total_bookings_last_90_days: (bookings90d.data ?? []).length,
      token_balance: tokenBalance,
      tokens_earned_last_90_days: tokens90d,
      referrals_active: (referrals.data ?? []).length,
      days_until_expiry: daysUntilExpiry,
      has_concierge_request: (concierge.data ?? []).length > 0,
    });

    // Persist score to user_profiles.
    await db
      .from('user_profiles')
      .update({ churn_score: churnScore.churn_probability })
      .eq('id', userId);

    scores.push(churnScore);
  }

  return scores;
}
