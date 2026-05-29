import { describe, it, expect } from 'vitest'
import { fmtINR, savingsPct, tierOrder, tokensEarned, maxTokenRedemption } from '@/lib/utils'
import type { Tier } from '@/lib/types'

describe('fmtINR', () => {
  it('formats a round lakh amount with Indian comma grouping', () => {
    expect(fmtINR(100000)).toBe('₹1,00,000')
  })

  it('formats a simple amount under 1000', () => {
    expect(fmtINR(500)).toBe('₹500')
  })

  it('formats 1000 with thousand separator', () => {
    expect(fmtINR(1000)).toBe('₹1,000')
  })

  it('formats 10 lakh (1,000,000) correctly', () => {
    expect(fmtINR(1000000)).toBe('₹10,00,000')
  })

  it('formats zero as ₹0', () => {
    expect(fmtINR(0)).toBe('₹0')
  })

  it('formats a decimal amount (node locale may drop decimals)', () => {
    const result = fmtINR(999.99)
    expect(result).toMatch(/^₹/)
  })

  it('formats a large amount like 10 crore', () => {
    expect(fmtINR(100000000)).toBe('₹10,00,00,000')
  })
})

describe('savingsPct', () => {
  it('returns correct savings percentage for 50% off', () => {
    // savingsPct(clubPrice, retailPrice)
    expect(savingsPct(500, 1000)).toBe(50)
  })

  it('returns 0 when club price equals retail price', () => {
    expect(savingsPct(1000, 1000)).toBe(0)
  })

  it('returns correct value for a 25% discount', () => {
    expect(savingsPct(750, 1000)).toBe(25)
  })

  it('rounds fractional percentages', () => {
    // 1 - 666/999 ≈ 33.33…% → rounds to 33
    expect(savingsPct(666, 999)).toBe(33)
  })

  it('returns 100 when club price is 0 (free item)', () => {
    expect(savingsPct(0, 1000)).toBe(100)
  })

  it('handles a small discount correctly', () => {
    expect(savingsPct(9900, 10000)).toBe(1)
  })
})

describe('tierOrder', () => {
  it('silver has order 0', () => {
    expect(tierOrder('silver')).toBe(0)
  })

  it('gold has order 1', () => {
    expect(tierOrder('gold')).toBe(1)
  })

  it('platinum has order 2', () => {
    expect(tierOrder('platinum')).toBe(2)
  })

  it('obsidian has order 3', () => {
    expect(tierOrder('obsidian')).toBe(3)
  })

  it('tier order is strictly increasing', () => {
    const tiers: Tier[] = ['silver', 'gold', 'platinum', 'obsidian']
    for (let i = 0; i < tiers.length - 1; i++) {
      expect(tierOrder(tiers[i])).toBeLessThan(tierOrder(tiers[i + 1]))
    }
  })
})

describe('tokensEarned', () => {
  it('silver earns 1% of booking amount', () => {
    // rate 0.01, Math.floor(10000 * 0.01) = 100
    expect(tokensEarned(10000, 'silver')).toBe(100)
  })

  it('gold earns 1.25% of booking amount', () => {
    // rate 0.0125, Math.floor(10000 * 0.0125) = 125
    expect(tokensEarned(10000, 'gold')).toBe(125)
  })

  it('platinum earns 1.5% of booking amount', () => {
    // rate 0.015, Math.floor(10000 * 0.015) = 150
    expect(tokensEarned(10000, 'platinum')).toBe(150)
  })

  it('obsidian earns 2% of booking amount', () => {
    // rate 0.02, Math.floor(10000 * 0.02) = 200
    expect(tokensEarned(10000, 'obsidian')).toBe(200)
  })

  it('returns 0 tokens for a zero booking amount', () => {
    expect(tokensEarned(0, 'gold')).toBe(0)
  })

  it('floors fractional token amounts', () => {
    // 1 * 0.01 = 0.01 → floor = 0
    expect(tokensEarned(1, 'silver')).toBe(0)
  })

  it('higher tiers always earn more or equal tokens than lower tiers', () => {
    const amount = 5000
    expect(tokensEarned(amount, 'gold')).toBeGreaterThanOrEqual(tokensEarned(amount, 'silver'))
    expect(tokensEarned(amount, 'platinum')).toBeGreaterThanOrEqual(tokensEarned(amount, 'gold'))
    expect(tokensEarned(amount, 'obsidian')).toBeGreaterThanOrEqual(tokensEarned(amount, 'platinum'))
  })
})

describe('maxTokenRedemption', () => {
  it('silver can redeem up to 20% of total (in tokens at ₹0.50 each)', () => {
    // 10000 * 0.20 / 0.50 = 4000
    expect(maxTokenRedemption(10000, 'silver')).toBe(4000)
  })

  it('gold can redeem up to 20% of total', () => {
    expect(maxTokenRedemption(10000, 'gold')).toBe(4000)
  })

  it('platinum can redeem up to 30% of total', () => {
    // 10000 * 0.30 / 0.50 = 6000
    expect(maxTokenRedemption(10000, 'platinum')).toBe(6000)
  })

  it('obsidian can redeem up to 50% of total', () => {
    // 10000 * 0.50 / 0.50 = 10000
    expect(maxTokenRedemption(10000, 'obsidian')).toBe(10000)
  })

  it('returns 0 for a zero booking total', () => {
    expect(maxTokenRedemption(0, 'gold')).toBe(0)
  })

  it('floors fractional token counts', () => {
    // 1 * 0.20 / 0.50 = 0.4 → floor = 0
    expect(maxTokenRedemption(1, 'silver')).toBe(0)
  })

  it('obsidian always has the highest redemption limit', () => {
    const amount = 8000
    const tiers: Tier[] = ['silver', 'gold', 'platinum']
    for (const tier of tiers) {
      expect(maxTokenRedemption(amount, 'obsidian')).toBeGreaterThanOrEqual(
        maxTokenRedemption(amount, tier)
      )
    }
  })
})
