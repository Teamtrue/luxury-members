import { describe, it, expect } from 'vitest'
import {
  generateSecureToken,
  createHmac,
  timingSafeEqual,
  hashToken,
  generateOTP,
} from '@/lib/security/tokens'

describe('generateSecureToken', () => {
  it('returns a hex string', () => {
    const token = generateSecureToken()
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it('returns 64 characters by default (32 bytes)', () => {
    const token = generateSecureToken()
    expect(token).toHaveLength(64)
  })

  it('returns correct length for a custom byte count', () => {
    const token = generateSecureToken(16)
    expect(token).toHaveLength(32)
  })

  it('returns different values on successive calls', () => {
    const a = generateSecureToken()
    const b = generateSecureToken()
    expect(a).not.toBe(b)
  })

  it('returns a non-empty string for 1 byte', () => {
    const token = generateSecureToken(1)
    expect(token).toHaveLength(2)
  })
})

describe('createHmac', () => {
  it('returns a hex string', () => {
    const mac = createHmac('secret', 'data')
    expect(mac).toMatch(/^[0-9a-f]+$/)
  })

  it('returns the same output for the same inputs', () => {
    const mac1 = createHmac('my-secret', 'hello')
    const mac2 = createHmac('my-secret', 'hello')
    expect(mac1).toBe(mac2)
  })

  it('returns different output when the secret differs', () => {
    const mac1 = createHmac('secret-a', 'hello')
    const mac2 = createHmac('secret-b', 'hello')
    expect(mac1).not.toBe(mac2)
  })

  it('returns different output when the data differs', () => {
    const mac1 = createHmac('secret', 'message-a')
    const mac2 = createHmac('secret', 'message-b')
    expect(mac1).not.toBe(mac2)
  })

  it('handles empty string data', () => {
    const mac = createHmac('secret', '')
    expect(mac).toBeTruthy()
    expect(mac).toHaveLength(64)
  })

  it('handles empty string secret', () => {
    const mac = createHmac('', 'data')
    expect(mac).toBeTruthy()
  })

  it('handles very long inputs', () => {
    const longData = 'x'.repeat(10_000)
    const mac = createHmac('secret', longData)
    expect(mac).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('timingSafeEqual', () => {
  it('returns true when both strings are identical', () => {
    expect(timingSafeEqual('hello', 'hello')).toBe(true)
  })

  it('returns false when strings differ', () => {
    expect(timingSafeEqual('hello', 'world')).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(timingSafeEqual('short', 'muchlongerstring')).toBe(false)
  })

  it('returns false when one string is empty', () => {
    expect(timingSafeEqual('', 'notempty')).toBe(false)
  })

  it('returns true for two empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true)
  })

  it('returns false for strings that differ by one character', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false)
  })

  it('handles long equal strings', () => {
    const long = 'a'.repeat(1000)
    expect(timingSafeEqual(long, long)).toBe(true)
  })

  it('handles long unequal strings', () => {
    const longA = 'a'.repeat(1000)
    const longB = 'a'.repeat(999) + 'b'
    expect(timingSafeEqual(longA, longB)).toBe(false)
  })
})

describe('hashToken', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashToken('some-token')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input always gives same output', () => {
    const hash1 = hashToken('my-token')
    const hash2 = hashToken('my-token')
    expect(hash1).toBe(hash2)
  })

  it('returns different hashes for different inputs', () => {
    const hash1 = hashToken('token-a')
    const hash2 = hashToken('token-b')
    expect(hash1).not.toBe(hash2)
  })

  it('hashes an empty string', () => {
    const hash = hashToken('')
    expect(hash).toHaveLength(64)
  })

  it('hashes a very long token', () => {
    const hash = hashToken('x'.repeat(5000))
    expect(hash).toHaveLength(64)
  })
})

describe('generateOTP', () => {
  it('returns a 6-digit string by default', () => {
    const otp = generateOTP()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('returns only digit characters', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOTP()
      expect(otp).toMatch(/^\d+$/)
    }
  })

  it('is zero-padded to the correct length', () => {
    // Run many times to increase chance of getting a leading-zero case
    for (let i = 0; i < 50; i++) {
      const otp = generateOTP(6)
      expect(otp).toHaveLength(6)
    }
  })

  it('generates OTPs within valid range (000000–999999)', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOTP(6)
      const num = parseInt(otp, 10)
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(999999)
    }
  })

  it('returns different values on successive calls', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOTP()))
    // With 6-digit OTPs, the chance of 20 identical values is astronomically small
    expect(otps.size).toBeGreaterThan(1)
  })

  it('supports custom digit count of 4', () => {
    const otp = generateOTP(4)
    expect(otp).toMatch(/^\d{4}$/)
  })

  it('supports custom digit count of 8', () => {
    const otp = generateOTP(8)
    expect(otp).toMatch(/^\d{8}$/)
  })

  it('throws a RangeError for digits < 4', () => {
    expect(() => generateOTP(3)).toThrow(RangeError)
  })

  it('throws a RangeError for digits > 15', () => {
    expect(() => generateOTP(16)).toThrow(RangeError)
  })
})
