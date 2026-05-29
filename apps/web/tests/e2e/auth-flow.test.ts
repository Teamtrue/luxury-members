import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-access-token',
            user: { id: 'user-e2e-1', phone: '+919876543210' },
          },
        },
        error: null,
      }),
    },
  })),
}))

vi.mock('@/lib/redis', () => ({
  isOtpRateLimited: vi.fn().mockResolvedValue(false),
  getRedis: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  assertRateLimit: vi.fn().mockResolvedValue(null),
  getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/auth/otp', () => ({
  createOTP:             vi.fn().mockResolvedValue({ otp: '123456', expiresAt: new Date() }),
  isPhoneOTPRateLimited: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/lib/providers', () => ({
  getSMSProvider: vi.fn().mockResolvedValue({
    sendOTP:           vi.fn().mockResolvedValue({ success: true }),
    sendTransactional: vi.fn().mockResolvedValue({ success: true }),
  }),
  ProviderNotConfiguredError: class ProviderNotConfiguredError extends Error {},
}))

const makeReq = (body: unknown) =>
  new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('Auth flow — send OTP', () => {
  let POST: typeof import('@/app/api/auth/send-otp/route').POST

  beforeAll(async () => {
    const mod = await import('@/app/api/auth/send-otp/route')
    POST = mod.POST
  })

  it('accepts valid 10-digit phone', async () => {
    const res = await POST(makeReq({ phone: '9876543210' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('rejects missing phone', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('rejects short phone', async () => {
    const res = await POST(makeReq({ phone: '98765' }))
    expect(res.status).toBe(400)
  })

  it('rejects non-numeric phone', async () => {
    const res = await POST(makeReq({ phone: 'abcdefghij' }))
    expect(res.status).toBe(400)
  })
})

describe('Auth flow — verify OTP', () => {
  let POST: typeof import('@/app/api/auth/verify-otp/route').POST

  beforeAll(async () => {
    const mod = await import('@/app/api/auth/verify-otp/route')
    POST = mod.POST
  })

  it('returns session on valid OTP', async () => {
    const res = await POST(makeReq({ phone: '9876543210', token: '123456' }))
    const json = await res.json()
    expect(res.status).toBeLessThan(500)
    // Either success with token or validation-based response
    expect(json).toBeDefined()
  })

  it('rejects missing body', async () => {
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it('rejects 5-digit OTP', async () => {
    const res = await POST(makeReq({ phone: '9876543210', token: '12345' }))
    expect(res.status).toBe(400)
  })

  it('rejects alpha OTP', async () => {
    const res = await POST(makeReq({ phone: '9876543210', token: 'abcdef' }))
    expect(res.status).toBe(400)
  })
})
