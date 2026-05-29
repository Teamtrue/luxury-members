import { describe, it, expect } from 'vitest'
import {
  sendOtpSchema,
  verifyOtpSchema,
  createBookingSchema,
  createDealSchema,
} from '@/lib/validations'

describe('sendOtpSchema', () => {
  it('accepts a valid 10-digit phone number', () => {
    const result = sendOtpSchema.safeParse({ phone: '9876543210' })
    expect(result.success).toBe(true)
  })

  it('rejects a phone number that is too short (9 digits)', () => {
    const result = sendOtpSchema.safeParse({ phone: '987654321' })
    expect(result.success).toBe(false)
  })

  it('rejects a phone number that is too long (11 digits)', () => {
    const result = sendOtpSchema.safeParse({ phone: '98765432101' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-numeric phone number', () => {
    const result = sendOtpSchema.safeParse({ phone: 'abcdefghij' })
    expect(result.success).toBe(false)
  })

  it('rejects a phone number with spaces', () => {
    const result = sendOtpSchema.safeParse({ phone: '98765 43210' })
    expect(result.success).toBe(false)
  })

  it('rejects a phone number with dashes', () => {
    const result = sendOtpSchema.safeParse({ phone: '9876-543210' })
    expect(result.success).toBe(false)
  })

  it('rejects missing phone field', () => {
    const result = sendOtpSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects an empty phone string', () => {
    const result = sendOtpSchema.safeParse({ phone: '' })
    expect(result.success).toBe(false)
  })
})

describe('verifyOtpSchema', () => {
  it('accepts a valid phone + 6-digit OTP', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210', otp: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects a 5-digit OTP', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210', otp: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects a 7-digit OTP', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210', otp: '1234567' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-numeric OTP', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210', otp: 'abcdef' })
    expect(result.success).toBe(false)
  })

  it('rejects when otp field is missing', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210' })
    expect(result.success).toBe(false)
  })

  it('rejects when phone is invalid', () => {
    const result = verifyOtpSchema.safeParse({ phone: '12345', otp: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty OTP', () => {
    const result = verifyOtpSchema.safeParse({ phone: '9876543210', otp: '' })
    expect(result.success).toBe(false)
  })
})

describe('createBookingSchema', () => {
  const validBooking = {
    deal_id: 'deal-abc-123',
    delivery_address: '123 Main Street, Mumbai, Maharashtra 400001',
    tokens_used: 0,
  }

  it('accepts a valid booking payload with required fields', () => {
    const result = createBookingSchema.safeParse(validBooking)
    expect(result.success).toBe(true)
  })

  it('rejects when deal_id is missing', () => {
    const { deal_id, ...rest } = validBooking
    const result = createBookingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects when deal_id is an empty string', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, deal_id: '' })
    expect(result.success).toBe(false)
  })

  it('rejects when delivery_address is missing', () => {
    const { delivery_address, ...rest } = validBooking
    const result = createBookingSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects when delivery_address is too short (< 10 chars)', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, delivery_address: 'Short' })
    expect(result.success).toBe(false)
  })

  it('accepts optional payment_method when valid', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, payment_method: 'upi' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid payment_method value', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, payment_method: 'bitcoin' })
    expect(result.success).toBe(false)
  })

  it('tokens_used defaults to 0 when omitted', () => {
    const { tokens_used, ...rest } = validBooking
    const result = createBookingSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tokens_used).toBe(0)
    }
  })

  it('rejects negative tokens_used', () => {
    const result = createBookingSchema.safeParse({ ...validBooking, tokens_used: -1 })
    expect(result.success).toBe(false)
  })
})

describe('createDealSchema', () => {
  const validDeal = {
    title: 'Premium Hotel Stay',
    category: 'travel',
    club_price: 5000,
    retail_price: 10000,
    min_tier: 'silver',
    expires_at: '2027-01-01T00:00:00.000Z',
  }

  it('accepts a valid deal payload', () => {
    const result = createDealSchema.safeParse(validDeal)
    expect(result.success).toBe(true)
  })

  it('rejects when title is missing', () => {
    const { title, ...rest } = validDeal
    const result = createDealSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects a title shorter than 3 characters', () => {
    const result = createDealSchema.safeParse({ ...validDeal, title: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rejects a negative club_price', () => {
    const result = createDealSchema.safeParse({ ...validDeal, club_price: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects a zero club_price', () => {
    const result = createDealSchema.safeParse({ ...validDeal, club_price: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects a negative retail_price', () => {
    const result = createDealSchema.safeParse({ ...validDeal, retail_price: -500 })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid min_tier', () => {
    const result = createDealSchema.safeParse({ ...validDeal, min_tier: 'diamond' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid min_tier values', () => {
    for (const tier of ['silver', 'gold', 'platinum', 'obsidian'] as const) {
      const result = createDealSchema.safeParse({ ...validDeal, min_tier: tier })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an invalid expires_at (non-ISO datetime)', () => {
    const result = createDealSchema.safeParse({ ...validDeal, expires_at: '01-01-2027' })
    expect(result.success).toBe(false)
  })

  it('rejects when category is missing', () => {
    const { category, ...rest } = validDeal
    const result = createDealSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts optional brand field', () => {
    const result = createDealSchema.safeParse({ ...validDeal, brand: 'Taj Hotels' })
    expect(result.success).toBe(true)
  })

  it('accepts optional max_bookings when positive', () => {
    const result = createDealSchema.safeParse({ ...validDeal, max_bookings: 50 })
    expect(result.success).toBe(true)
  })

  it('rejects a non-positive max_bookings', () => {
    const result = createDealSchema.safeParse({ ...validDeal, max_bookings: 0 })
    expect(result.success).toBe(false)
  })
})
