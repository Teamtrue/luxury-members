/**
 * lib/api-helpers.ts
 * ---------------------------------------------------------------------------
 * Shared utilities used by every PlutusClub API route handler.
 *
 * Goals:
 *   - Standardise success / error response shapes.
 *   - Centralise auth guards so individual routes stay concise.
 *   - Provide validated body parsing with Zod.
 *   - Build structured audit log entries ready for DB insertion.
 * ---------------------------------------------------------------------------
 */

import type { ZodSchema } from 'zod';
import { getSecurityHeaders }   from './security/headers';
import { getAuthUser }          from './auth/session';
import { getAdminSession }      from './auth/session';
import { assertPermission }     from './auth/rbac';

export type { AuthUser, AdminSession } from './auth/session';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Build a standardised JSON success response.
 *
 * @param data   - The payload to include in the `data` field.
 * @param status - HTTP status code (default 200).
 * @returns JSON Response with security headers applied.
 */
export function apiSuccess<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getSecurityHeaders(),
      },
    }
  );
}

/**
 * Build a standardised JSON error response.
 *
 * @param message - Human-readable error message for the client.
 * @param status  - HTTP status code (default 400).
 * @param details - Optional structured error details (e.g. Zod validation issues).
 * @returns JSON Response with security headers applied.
 */
export function apiError(message: string, status = 400, details?: unknown): Response {
  const body: { success: false; error: string; details?: unknown } = {
    success: false,
    error: message,
  };
  if (details !== undefined) body.details = details;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
    },
  });
}

// ---------------------------------------------------------------------------
// Request body parsing
// ---------------------------------------------------------------------------

/**
 * Parse and validate the JSON request body against a Zod schema.
 *
 * Returns `{ data }` on success, or `{ error: Response(400) }` if the body is
 * malformed JSON or fails schema validation.
 *
 * @param request - The incoming Request object.
 * @param schema  - A Zod schema to validate the parsed body against.
 * @returns `{ data: T }` on success, or `{ error: Response }` on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: Response }> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      error: apiError('Invalid JSON in request body.', 400),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      error: apiError(
        firstIssue?.message ?? 'Request body validation failed.',
        400,
        result.error.issues
      ),
    };
  }

  return { data: result.data };
}

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

/**
 * Assert the request comes from an authenticated member.
 *
 * Returns `{ user }` if authenticated, or `{ error: Response(401) }` if not.
 * Use the `error` discriminant to early-return from the route handler:
 *
 * ```ts
 * const auth = await requireAuth();
 * if ('error' in auth) return auth.error;
 * const { user } = auth;
 * ```
 *
 * @param request - Optional Request (required when calling from Edge/API routes
 *                  outside Next.js App Router server context).
 * @returns `{ user: AuthUser }` or `{ error: Response }`.
 */
export async function requireAuth(
  request?: Request
): Promise<{ user: import('./auth/session').AuthUser } | { error: Response }> {
  const user = await getAuthUser(request);
  if (!user) {
    return { error: apiError('Authentication required.', 401) };
  }
  return { user };
}

/**
 * Assert the request comes from a valid admin session with an optional permission check.
 *
 * Returns `{ session }` on success, or `{ error: Response(401 | 403) }` on failure.
 *
 * ```ts
 * const auth = await requireAdmin(request, 'deals:approve');
 * if ('error' in auth) return auth.error;
 * const { session } = auth;
 * ```
 *
 * @param request    - The incoming HTTP Request.
 * @param permission - Optional permission string to check (e.g. `'members:write'`).
 *                     If omitted, only session validity is checked.
 * @returns `{ session: AdminSession }` or `{ error: Response }`.
 */
export async function requireAdmin(
  request: Request,
  permission?: string
): Promise<{ session: import('./auth/session').AdminSession } | { error: Response }> {
  const session = await getAdminSession(request);

  if (!session) {
    return { error: apiError('Admin authentication required.', 401) };
  }

  if (permission) {
    const permError = assertPermission(session, permission);
    if (permError) return { error: permError };
  }

  return { session };
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Pagination parameters extracted from URL search params. */
export interface Pagination {
  /** 1-based current page number. */
  page: number;
  /** Number of items per page (max 100). */
  limit: number;
  /** 0-based row offset for use in DB queries. */
  offset: number;
}

/**
 * Extract and normalise pagination parameters from URL search params.
 *
 * Defaults: page=1, limit=20. Max limit: 100 (prevents accidental data dumps).
 *
 * @param searchParams - URL search params from `new URL(request.url).searchParams`.
 * @returns Normalised `Pagination` object.
 */
export function getPagination(searchParams: URLSearchParams): Pagination {
  const rawPage  = parseInt(searchParams.get('page')  ?? '1',  10);
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);

  const page  = isNaN(rawPage)  || rawPage  < 1  ? 1   : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1  ? 20  :
                rawLimit > 100                    ? 100 : rawLimit;

  return { page, limit, offset: (page - 1) * limit };
}

// ---------------------------------------------------------------------------
// Audit log entry builder
// ---------------------------------------------------------------------------

/** Shape of an audit log entry ready for insertion into `audit_logs`. */
export interface AuditLogEntry {
  action:      string;
  actor_type:  'member' | 'admin' | 'system';
  actor_id?:   string;
  target_type?: string;
  target_id?:  string;
  details:     Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Build a structured audit log entry from semantic parameters.
 *
 * The returned object is ready to be passed directly to:
 * ```ts
 * supabase.from('audit_logs').insert(entry)
 * ```
 *
 * @param params.action      - Dot-namespaced action name (e.g. `'booking.created'`).
 * @param params.actorType   - Who performed the action: `'member'`, `'admin'`, or `'system'`.
 * @param params.actorId     - UUID of the actor (omit for system actions).
 * @param params.targetType  - Resource type affected (e.g. `'booking'`, `'deal'`).
 * @param params.targetId    - UUID of the affected resource.
 * @param params.details     - Additional structured context (amounts, field changes, etc.).
 * @param params.request     - Optional Request to extract IP and User-Agent from.
 * @returns Audit log entry object.
 */
export function buildAuditEntry(params: {
  action:      string;
  actorType:   'member' | 'admin' | 'system';
  actorId?:    string;
  targetType?: string;
  targetId?:   string;
  details?:    Record<string, unknown>;
  request?:    Request;
}): AuditLogEntry {
  const { action, actorType, actorId, targetType, targetId, details = {}, request } = params;

  const entry: AuditLogEntry = {
    action,
    actor_type:  actorType,
    details,
  };

  if (actorId)     entry.actor_id    = actorId;
  if (targetType)  entry.target_type = targetType;
  if (targetId)    entry.target_id   = targetId;

  if (request) {
    // Extract IP — mirrors logic in getClientIP() but without the import cycle.
    const h = (name: string) => request.headers.get(name);
    const ip =
      h('cf-connecting-ip') ??
      h('x-real-ip') ??
      h('x-forwarded-for')?.split(',')[0]?.trim() ??
      undefined;

    if (ip)             entry.ip_address = ip;
    const ua = h('user-agent');
    if (ua)             entry.user_agent = ua;
  }

  return entry;
}
