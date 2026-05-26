/**
 * lib/auth/session.ts
 * ---------------------------------------------------------------------------
 * Session management for PlutusClub.
 *
 * Two session types:
 *   1. Member sessions  — managed entirely by Supabase Auth (JWT + cookie).
 *      Verification via `supabase.auth.getUser()` which validates the JWT
 *      against Supabase's public key (no DB call needed for token validation).
 *
 *   2. Admin sessions   — custom token-based sessions stored in `admin_sessions`
 *      table. The raw token is held in a `__admin_session` HttpOnly cookie;
 *      only the SHA-256 hash is stored in the database.
 * ---------------------------------------------------------------------------
 */

import { generateSecureToken, hashToken } from '../security/tokens';
import { createClient }             from '../supabase/server';
import { createServiceRoleClient }  from '../supabase/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents an authenticated member (Supabase Auth user). */
export interface AuthUser {
  /** Supabase auth.users UUID. */
  id: string;
  /** User email address (may be undefined for phone-only accounts). */
  email?: string;
  /** User phone number in E.164 format (may be undefined for email-only accounts). */
  phone?: string;
  /** Always 'member' — distinguishes from AdminSession. */
  role: 'member';
}

/** Role options for admin users. */
export type AdminRole = 'super_admin' | 'admin' | 'support' | 'finance' | 'partner_manager';

/** Represents a validated admin session. */
export interface AdminSession {
  /** admin_sessions.id (UUID). */
  id: string;
  /** admin_users.id (not auth.users.id) of the admin. */
  adminUserId: string;
  /** The admin's assigned role. */
  role: AdminRole;
  /** IP address from which the session was created. */
  ip: string;
  /** Absolute expiry time for this session. */
  expiresAt: Date;
}

/** Cookie name for admin sessions — HttpOnly, Secure, SameSite=Strict. */
export const ADMIN_SESSION_COOKIE = '__admin_session';

/** Admin session lifetime: 8 hours. */
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Member sessions (Supabase Auth)
// ---------------------------------------------------------------------------

/**
 * Retrieve the currently authenticated member from the Supabase session.
 *
 * Uses `getUser()` (server-side validation via JWKS), not `getSession()` which
 * relies on locally-stored data and is not safe for auth decisions.
 *
 * @param _request - Unused in App Router (cookies() is called inside createClient).
 *                   Accepted for API-route compatibility parity with getAdminSession.
 * @returns The authenticated `AuthUser`, or `null` if not signed in.
 */
export async function getAuthUser(_request?: Request): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      id:    user.id,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      role:  'member',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Admin sessions (custom token)
// ---------------------------------------------------------------------------

/**
 * Retrieve and validate an admin session from the incoming request.
 *
 * Token lookup order:
 *   1. `Authorization: Bearer <token>` header (for programmatic API clients).
 *   2. `__admin_session` HttpOnly cookie (for browser-based admin console).
 *
 * The raw token is hashed (SHA-256) and the hash is looked up in
 * `admin_sessions`. The session record joins `admin_users` to fetch the role.
 *
 * @param request - The incoming HTTP Request.
 * @returns The validated `AdminSession`, or `null` if absent / invalid / expired.
 */
export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  // Extract raw token from header or cookie.
  let rawToken: string | null = null;

  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice('Bearer '.length).trim();
  }

  if (!rawToken) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const cookies = parseCookieHeader(cookieHeader);
    rawToken = cookies[ADMIN_SESSION_COOKIE] ?? null;
  }

  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  try {
    const db = createServiceRoleClient();

    // Join admin_sessions → admin_users to get role in a single query.
    const { data, error } = await db
      .from('admin_sessions')
      .select(`
        id,
        admin_user_id,
        expires_at,
        ip_address,
        admin_users ( role )
      `)
      .eq('token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Supabase returns joined tables as nested objects.
    const adminUsers = data.admin_users as { role: AdminRole } | null;
    if (!adminUsers) return null;

    return {
      id:           data.id as string,
      adminUserId:  data.admin_user_id as string,
      role:         adminUsers.role,
      ip:           (data.ip_address as string) ?? '',
      expiresAt:    new Date(data.expires_at as string),
    };
  } catch {
    return null;
  }
}

/**
 * Create a new admin session in the database and return the raw session token.
 *
 * The caller is responsible for:
 *   - Setting the returned token as an HttpOnly, Secure, SameSite=Strict cookie.
 *   - NOT logging or persisting the raw token anywhere else.
 *
 * @param adminUserId - `admin_users.id` (NOT `auth.users.id`) of the admin.
 * @param ip          - Client IP address (for audit / anomaly detection).
 * @param userAgent   - Client User-Agent string.
 * @returns The raw session token (64-char hex string). Hash is stored in DB.
 * @throws Error if the database insert fails.
 */
export async function createAdminSession(
  adminUserId: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const rawToken  = generateSecureToken(32); // 64-char hex
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString();

  const db = createServiceRoleClient();
  const { error } = await db.from('admin_sessions').insert({
    admin_user_id: adminUserId,
    token_hash:    tokenHash,
    expires_at:    expiresAt,
    ip_address:    ip,
    user_agent:    userAgent,
  });

  if (error) {
    throw new Error(`Failed to create admin session: ${error.message}`);
  }

  return rawToken;
}

/**
 * Invalidate (delete) an admin session by its raw token.
 * Call this on explicit logout.
 *
 * @param rawToken - The raw session token from the cookie / header.
 */
export async function invalidateAdminSession(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const db = createServiceRoleClient();
  await db.from('admin_sessions').delete().eq('token_hash', tokenHash);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a raw `Cookie` header string into a key-value map.
 * Handles URL-encoded values and multiple cookies in one header.
 *
 * @param header - Raw `Cookie` header value.
 * @returns Plain object mapping cookie names to their decoded values.
 */
function parseCookieHeader(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [
        decodeURIComponent(key?.trim() ?? ''),
        decodeURIComponent(rest.join('=')),
      ];
    })
  );
}
