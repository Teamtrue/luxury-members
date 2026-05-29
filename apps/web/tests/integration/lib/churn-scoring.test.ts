import { describe, it, expect } from 'vitest'
import { scoreChurnRisk } from '@/lib/ai/churn'

const base = {
  member_id: 'test-member',
  tier: 'gold',
  membership_expires_at: new Date(Date.now() + 90 * 86_400_000).toISOString(),
  days_since_last_booking: 10,
  total_bookings_lifetime: 20,
  total_bookings_last_90_days: 5,
  token_balance: 500,
  tokens_earned_last_90_days: 200,
  referrals_active: 2,
  days_until_expiry: 90,
  has_concierge_request: false,
}

describe('scoreChurnRisk', () => {
  it('gives low risk to active members', () => {
    const r = scoreChurnRisk(base)
    expect(r.risk_level).toBe('low')
    expect(r.recommended_action).toBe('none')
  })

  it('gives critical risk to inactive expiring members', () => {
    const r = scoreChurnRisk({
      ...base,
      days_since_last_booking: 80,
      total_bookings_last_90_days: 0,
      days_until_expiry: 3,
      token_balance: 0,
      referrals_active: 0,
    })
    expect(r.risk_level).toBe('critical')
    expect(r.recommended_action).toBe('personal_outreach')
  })

  it('lowers score when member has concierge request', () => {
    const without = scoreChurnRisk({ ...base, days_since_last_booking: 50, total_bookings_last_90_days: 0 })
    const with_concierge = scoreChurnRisk({ ...base, days_since_last_booking: 50, total_bookings_last_90_days: 0, has_concierge_request: true })
    expect(with_concierge.churn_probability).toBeLessThan(without.churn_probability)
  })

  it('clamps probability between 0 and 1', () => {
    const r = scoreChurnRisk({ ...base, days_since_last_booking: 9999, total_bookings_last_90_days: 0 })
    expect(r.churn_probability).toBeLessThanOrEqual(1)
    expect(r.churn_probability).toBeGreaterThanOrEqual(0)
  })

  it('returns scored_at ISO timestamp', () => {
    const r = scoreChurnRisk(base)
    expect(new Date(r.scored_at).getTime()).toBeGreaterThan(0)
  })

  it('active referrals reduce churn score', () => {
    const noRef   = scoreChurnRisk({ ...base, referrals_active: 0 })
    const withRef = scoreChurnRisk({ ...base, referrals_active: 3 })
    expect(withRef.churn_probability).toBeLessThan(noRef.churn_probability)
  })
})
