/**
 * tests/unit/security/rbac.test.ts
 * Verifies that assertPermission enforces role boundaries correctly.
 * Key assertions:
 *   - 'support' role cannot perform 'providers:write' or 'deals:approve' (super_admin/admin only)
 *   - 'finance' role cannot perform 'members:write' or 'providers:write'
 *   - 'super_admin' can perform any permission (wildcard)
 *   - 'admin' can approve deals but cannot modify providers
 */

import { describe, it, expect } from 'vitest'
import { hasPermission, assertPermission, ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import type { AdminRole } from '@/lib/auth/rbac'
import type { AdminSession } from '@/lib/auth/session'

function makeSession(role: AdminRole): AdminSession {
  return {
    id:          'session-test-id',
    adminUserId: 'admin-user-test-id',
    role,
    ip:          '127.0.0.1',
    expiresAt:   new Date(Date.now() + 3_600_000),
  }
}

describe('hasPermission', () => {
  it('super_admin has every permission via wildcard', () => {
    expect(hasPermission('super_admin', 'providers:write')).toBe(true)
    expect(hasPermission('super_admin', 'members:delete')).toBe(true)
    expect(hasPermission('super_admin', 'anything:at:all')).toBe(true)
  })

  it('support cannot perform admin-only actions', () => {
    expect(hasPermission('support', 'providers:write')).toBe(false)
    expect(hasPermission('support', 'deals:approve')).toBe(false)
    expect(hasPermission('support', 'members:write')).toBe(false)
    expect(hasPermission('support', 'analytics:read')).toBe(false)
  })

  it('support CAN perform its own allowed actions', () => {
    expect(hasPermission('support', 'members:read')).toBe(true)
    expect(hasPermission('support', 'disputes:read')).toBe(true)
    expect(hasPermission('support', 'disputes:resolve')).toBe(true)
    expect(hasPermission('support', 'bookings:read')).toBe(true)
  })

  it('finance cannot perform member writes or provider changes', () => {
    expect(hasPermission('finance', 'members:write')).toBe(false)
    expect(hasPermission('finance', 'providers:write')).toBe(false)
    expect(hasPermission('finance', 'deals:approve')).toBe(false)
    expect(hasPermission('finance', 'members:suspend')).toBe(false)
  })

  it('finance CAN perform its own allowed actions', () => {
    expect(hasPermission('finance', 'payments:read')).toBe(true)
    expect(hasPermission('finance', 'refunds:approve')).toBe(true)
    expect(hasPermission('finance', 'analytics:read')).toBe(true)
  })

  it('admin cannot modify provider credentials', () => {
    // admin has providers:read but NOT providers:write
    expect(hasPermission('admin', 'providers:read')).toBe(true)
    expect(hasPermission('admin', 'providers:write')).toBe(false)
  })

  it('partner_manager cannot access member or payment data', () => {
    expect(hasPermission('partner_manager', 'members:read')).toBe(false)
    expect(hasPermission('partner_manager', 'payments:read')).toBe(false)
    expect(hasPermission('partner_manager', 'refunds:approve')).toBe(false)
  })
})

describe('assertPermission', () => {
  it('returns null (allow) when session role has the permission', () => {
    const session = makeSession('admin')
    const result = assertPermission(session, 'deals:approve')
    expect(result).toBeNull()
  })

  it('returns 403 Response when session role lacks the permission', () => {
    const session = makeSession('support')
    const result = assertPermission(session, 'providers:write')
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })

  it('403 body includes the role and permission that was denied', async () => {
    const session = makeSession('finance')
    const result = assertPermission(session, 'members:write')
    expect(result).not.toBeNull()
    const body = await result!.json() as { error: string }
    expect(body.error).toContain('finance')
    expect(body.error).toContain('members:write')
  })

  it('super_admin is never denied', () => {
    const session = makeSession('super_admin')
    expect(assertPermission(session, 'providers:write')).toBeNull()
    expect(assertPermission(session, 'anything:sensitive')).toBeNull()
  })
})

describe('ROLE_PERMISSIONS registry completeness', () => {
  const allRoles: AdminRole[] = ['super_admin', 'admin', 'support', 'finance', 'partner_manager']

  it('every role has at least one permission', () => {
    for (const role of allRoles) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0)
    }
  })

  it('only super_admin has the wildcard', () => {
    for (const role of allRoles) {
      if (role === 'super_admin') continue
      expect(ROLE_PERMISSIONS[role]).not.toContain('*')
    }
  })
})
