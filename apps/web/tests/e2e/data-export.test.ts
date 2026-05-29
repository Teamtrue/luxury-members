import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/api-helpers', async (orig) => {
  const actual = await orig<typeof import('@/lib/api-helpers')>()
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      user: { id: 'user-e2e-export', email: 'export@example.com' },
    }),
  }
})

vi.mock('@/lib/supabase/service', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      gt:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({
          data: { user: { email: 'export@example.com' } },
        }),
      },
    },
  })),
}))

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn().mockResolvedValue(undefined) }))

import { GET } from '@/app/api/account/export/route'

describe('GDPR data export', () => {
  const req = new Request('http://localhost/api/account/export')

  it('returns a JSON attachment response', async () => {
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toContain('attachment')
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  it('response body is valid JSON', async () => {
    const res = await GET(req)
    const text = await res.text()
    expect(() => JSON.parse(text)).not.toThrow()
  })

  it('exported JSON has required top-level fields', async () => {
    const res = await GET(req)
    const data = await res.json()
    expect(data).toHaveProperty('exported_at')
    expect(data).toHaveProperty('memberships')
    expect(data).toHaveProperty('bookings')
    expect(data).toHaveProperty('payments')
  })
})
