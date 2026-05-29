import { describe, it, expect } from 'vitest'
import { scoreFraudRisk } from '@/lib/ai/fraud'

const base = {
  member_id: 'test-user',
  ip_address: '1.2.3.4',
  user_agent: 'TestAgent/1.0',
  amount_paise: 50_000,
  deal_id: 'deal-1',
  payment_method: 'razorpay',
  member_age_days: 120,
  lifetime_bookings: 5,
  bookings_last_24h: 1,
  tokens_used_pct: 0.1,
  is_new_delivery_address: false,
  same_ip_different_members: 0,
}

describe('scoreFraudRisk', () => {
  it('allows normal signals', () => {
    expect(scoreFraudRisk(base).action).toBe('allow')
  })

  it('blocks when IP shared across many accounts', () => {
    const r = scoreFraudRisk({ ...base, same_ip_different_members: 6 })
    expect(r.action).toBe('block')
    expect(r.triggered_rules).toContain('ip_shared_many_accounts')
  })

  it('blocks new account with high-value order', () => {
    const r = scoreFraudRisk({ ...base, member_age_days: 0, amount_paise: 200_000 })
    expect(r.action).toBe('block')
    expect(r.triggered_rules).toContain('new_account_high_value')
  })

  it('blocks excessive bookings in 24h', () => {
    const r = scoreFraudRisk({ ...base, bookings_last_24h: 11 })
    expect(r.action).toBe('block')
    expect(r.triggered_rules).toContain('excessive_bookings_24h')
  })

  it('flags high token redemption with additional signals', () => {
    // tokens_used_pct >0.8 (+25) + bookings_last_24h >5 (+15) = 40 → flag
    const r = scoreFraudRisk({ ...base, tokens_used_pct: 0.9, bookings_last_24h: 6 })
    expect(r.action).toBe('flag')
    expect(r.triggered_rules).toContain('high_token_redemption_pct')
  })

  it('flags new account with very high value and additional signal', () => {
    // member_age_days<7 + amount>500k (+30) + tokens (+25) = 55 → flag
    const r = scoreFraudRisk({ ...base, member_age_days: 5, amount_paise: 600_000, tokens_used_pct: 0.9 })
    expect(r.action).toBe('flag')
    expect(r.risk_score).toBeGreaterThan(40)
  })

  it('clamps risk_score to 100', () => {
    const r = scoreFraudRisk({ ...base, same_ip_different_members: 10, bookings_last_24h: 15, member_age_days: 0, amount_paise: 1_000_000 })
    expect(r.risk_score).toBeLessThanOrEqual(100)
  })

  it('blocked result includes reason message', () => {
    const r = scoreFraudRisk({ ...base, same_ip_different_members: 6 })
    expect(r.reason).toBeTruthy()
  })
})
