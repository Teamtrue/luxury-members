import { describe, it, expect } from 'vitest'
import {
  validatePasswordStrength,
  isCommonPassword,
  hashPassword,
  verifyPassword,
} from '@/lib/security/password'

describe('validatePasswordStrength', () => {
  it('returns valid=true for a strong password with all required character types', () => {
    const result = validatePasswordStrength('StrongPass1!')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns valid=true for a long strong password', () => {
    const result = validatePasswordStrength('MySuper$ecure99Pass!')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when password is too short (< 10 chars)', () => {
    const result = validatePasswordStrength('short1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 10 characters long.')
  })

  it('fails when password has no uppercase letter', () => {
    const result = validatePasswordStrength('alllowercase1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z).')
  })

  it('fails when password has no lowercase letter', () => {
    const result = validatePasswordStrength('ALLUPPERCASE1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z).')
  })

  it('fails when password has no digit', () => {
    const result = validatePasswordStrength('NoDigitsHere!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one number (0-9).')
  })

  it('fails when password has no special character', () => {
    const result = validatePasswordStrength('NoSpecial123A')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Password must contain at least one special character (e.g. !@#$%^&*).'
    )
  })

  it('accumulates multiple errors for a very weak password', () => {
    const result = validatePasswordStrength('abc')
    expect(result.valid).toBe(false)
    // Short, no uppercase, no digit, no special char (lowercase present)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('accepts a password with exactly 10 characters meeting all requirements', () => {
    const result = validatePasswordStrength('Abcdefg1@!')
    expect(result.valid).toBe(true)
  })

  it('returns errors as an array', () => {
    const result = validatePasswordStrength('weak')
    expect(Array.isArray(result.errors)).toBe(true)
  })
})

describe('isCommonPassword', () => {
  it('returns true for "password"', () => {
    expect(isCommonPassword('password')).toBe(true)
  })

  it('returns true for "qwerty123"', () => {
    expect(isCommonPassword('qwerty123')).toBe(true)
  })

  it('returns true for "123456789"', () => {
    expect(isCommonPassword('123456789')).toBe(true)
  })

  it('returns true for "admin123"', () => {
    expect(isCommonPassword('admin123')).toBe(true)
  })

  it('is case-insensitive — returns true for "PASSWORD"', () => {
    expect(isCommonPassword('PASSWORD')).toBe(true)
  })

  it('is case-insensitive — returns true for "Password"', () => {
    expect(isCommonPassword('Password')).toBe(true)
  })

  it('returns false for a random strong password', () => {
    expect(isCommonPassword('XkQ9#mPvL2@Zr!')).toBe(false)
  })

  it('returns false for a made-up unique phrase', () => {
    expect(isCommonPassword('plutusClub2024$ecure!')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isCommonPassword('')).toBe(false)
  })
})

describe('hashPassword and verifyPassword', () => {
  it('hash is not equal to the plaintext password', async () => {
    const plain = 'SecurePass1!'
    const hash = await hashPassword(plain)
    expect(hash).not.toBe(plain)
  })

  it('hash starts with bcrypt prefix ($2a$ or $2b$)', async () => {
    const hash = await hashPassword('SecurePass1!')
    expect(hash).toMatch(/^\$2[ab]\$/)
  })

  it('verifyPassword returns true for the correct password', async () => {
    const plain = 'MyC0rrectPass!'
    const hash = await hashPassword(plain)
    const result = await verifyPassword(plain, hash)
    expect(result).toBe(true)
  })

  it('verifyPassword returns false for the wrong password', async () => {
    const hash = await hashPassword('CorrectPass1!')
    const result = await verifyPassword('WrongPass1!', hash)
    expect(result).toBe(false)
  })

  it('two hashes of the same password are different (different salts)', async () => {
    const plain = 'SamePass1!'
    const hash1 = await hashPassword(plain)
    const hash2 = await hashPassword(plain)
    expect(hash1).not.toBe(hash2)
    // Both should still verify correctly
    expect(await verifyPassword(plain, hash1)).toBe(true)
    expect(await verifyPassword(plain, hash2)).toBe(true)
  })
}, 30000)
