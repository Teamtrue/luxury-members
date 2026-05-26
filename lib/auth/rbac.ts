/**
 * lib/auth/rbac.ts
 * ---------------------------------------------------------------------------
 * Role-Based Access Control (RBAC) for the PlutusClub admin console.
 *
 * Permission strings use dot-namespaced resource:action format.
 * `super_admin` holds the wildcard `'*'` which matches any permission.
 *
 * Usage in API routes:
 *   ```ts
 *   const { session } = await requireAdmin(request, 'deals:approve');
 *   // If permission denied, requireAdmin returns { error: Response(403) }
 *   ```
 * ---------------------------------------------------------------------------
 */

import type { AdminSession } from './session';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** All valid admin role identifiers. Keep in sync with `admin_role` DB enum. */
export type AdminRole = 'super_admin' | 'admin' | 'support' | 'finance' | 'partner_manager';

// ---------------------------------------------------------------------------
// Permission registry
// ---------------------------------------------------------------------------

/**
 * Exhaustive map of all permissions granted to each admin role.
 *
 * Design notes:
 *   - `super_admin` uses the special `'*'` wildcard — has all permissions.
 *   - Permissions are additive (no role can restrict another role's grants).
 *   - Add new permissions to the relevant roles here; do NOT scatter them
 *     across individual route files.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],

  admin: [
    // Member management
    'members:read',
    'members:write',
    'members:suspend',
    // Deal management
    'deals:read',
    'deals:write',
    'deals:approve',
    // Booking management
    'bookings:read',
    'bookings:refund',
    // Dispute resolution
    'disputes:read',
    'disputes:resolve',
    // Refund management
    'refunds:read',
    'refunds:approve',
    // Analytics
    'analytics:read',
    // Provider config — VIEW only, cannot modify credentials
    'providers:read',
    // Notifications
    'notifications:send',
    // Audit trail
    'audit:read',
  ],

  support: [
    'members:read',
    'members:suspend',
    'bookings:read',
    'disputes:read',
    'disputes:resolve',
    'refunds:read',
  ],

  finance: [
    'bookings:read',
    'payments:read',
    'payments:reconcile',
    'refunds:read',
    'refunds:approve',
    'analytics:read',
  ],

  partner_manager: [
    'deals:read',
    'deals:write',
    'analytics:read',
  ],
};

// ---------------------------------------------------------------------------
// Permission checks
// ---------------------------------------------------------------------------

/**
 * Check whether an admin role has a specific permission.
 *
 * `super_admin` always returns `true` (wildcard `'*'`).
 * For other roles, performs an exact string match against the role's permission list.
 *
 * @param role       - The admin role to check (e.g. `'support'`).
 * @param permission - The permission string to assert (e.g. `'disputes:resolve'`).
 * @returns `true` if the role has the permission, `false` otherwise.
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const grants = ROLE_PERMISSIONS[role];
  if (!grants) return false;
  // Wildcard — super_admin has every permission.
  if (grants.includes('*')) return true;
  return grants.includes(permission);
}

/**
 * Assert that an admin session has the required permission.
 *
 * Call this at the top of admin API route handlers after `requireAdmin()`.
 *
 * @param session    - The validated `AdminSession` from `getAdminSession()`.
 * @param permission - The permission the route requires (e.g. `'deals:approve'`).
 * @returns A 403 JSON Response if the permission is denied, or `null` if allowed.
 */
export function assertPermission(session: AdminSession, permission: string): Response | null {
  if (!hasPermission(session.role as AdminRole, permission)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Forbidden: your role (${session.role}) does not have the '${permission}' permission.`,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  return null;
}

/**
 * List all permissions granted to a given role.
 * Useful for building permission-aware UI (e.g. hiding unauthorised menu items).
 *
 * @param role - The admin role to inspect.
 * @returns Array of permission strings. Returns `['*']` for `super_admin`.
 */
export function listPermissions(role: AdminRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check whether a role can perform any action in a given resource namespace.
 * e.g. `canAccessResource('support', 'disputes')` → `true`
 *
 * @param role     - The admin role to check.
 * @param resource - Resource namespace prefix (e.g. `'disputes'`, `'payments'`).
 * @returns `true` if the role has at least one `{resource}:*` permission.
 */
export function canAccessResource(role: AdminRole, resource: string): boolean {
  const grants = ROLE_PERMISSIONS[role] ?? [];
  if (grants.includes('*')) return true;
  return grants.some((p) => p.startsWith(`${resource}:`));
}
