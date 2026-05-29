import { describe, it, expect } from 'vitest'
import { brand } from '@/lib/brand'

describe('brand config exports', () => {
  describe('brand.name', () => {
    it('is a non-empty string', () => {
      expect(typeof brand.name).toBe('string')
      expect(brand.name.length).toBeGreaterThan(0)
    })
  })

  describe('brand.domain', () => {
    it('contains a dot (looks like a domain)', () => {
      expect(brand.domain).toContain('.')
    })

    it('does not contain http or https', () => {
      expect(brand.domain).not.toMatch(/^https?:\/\//)
    })

    it('does not contain a trailing slash', () => {
      expect(brand.domain).not.toMatch(/\/$/)
    })
  })

  describe('brand.supportEmail', () => {
    it('contains an @ character', () => {
      expect(brand.supportEmail).toContain('@')
    })

    it('is a non-empty string', () => {
      expect(brand.supportEmail.length).toBeGreaterThan(0)
    })
  })

  describe('brand.primaryColor', () => {
    it('matches the #RRGGBB hex pattern', () => {
      expect(brand.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe('brand.tokenName', () => {
    it('is a non-empty string', () => {
      expect(typeof brand.tokenName).toBe('string')
      expect(brand.tokenName.length).toBeGreaterThan(0)
    })
  })

  describe('brand.gstin', () => {
    it('is exactly 15 characters long', () => {
      expect(brand.gstin.length).toBe(15)
    })

    it('matches the GSTIN format: 2-digit state + 5 uppercase letters + 4 digits + letter + alpha-numeric + Z + alpha-numeric', () => {
      // Format: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}
      expect(brand.gstin).toMatch(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    })
  })

  describe('brand.cin', () => {
    it('is exactly 21 characters long', () => {
      expect(brand.cin.length).toBe(21)
    })

    it('is a non-empty string', () => {
      expect(typeof brand.cin).toBe('string')
      expect(brand.cin.length).toBeGreaterThan(0)
    })
  })

  describe('other required brand fields', () => {
    it('has a non-empty legalName', () => {
      expect(typeof brand.legalName).toBe('string')
      expect(brand.legalName.length).toBeGreaterThan(0)
    })

    it('has a non-empty url starting with https', () => {
      expect(brand.url).toMatch(/^https:\/\//)
    })

    it('tokenValueInINR is a positive number', () => {
      expect(typeof brand.tokenValueInINR).toBe('number')
      expect(brand.tokenValueInINR).toBeGreaterThan(0)
    })

    it('currencySymbol is ₹', () => {
      expect(brand.currencySymbol).toBe('₹')
    })

    it('currency is INR', () => {
      expect(brand.currency).toBe('INR')
    })
  })
})
