/**
 * app/api/admin/login/route.ts
 * ---------------------------------------------------------------------------
 * Admin login endpoint.
 *
 * Flow:
 *   1. Rate-limit by IP (auth:login — 10 attempts / 15 min)
 *   2. Validate email + password (adminLoginSchema)
 *   3. Sign in via Supabase Auth, look up admin_users record
 *   4. Create admin session → set HttpOnly cookie
 *   5. Audit log (success and failure)
 * ---------------------------------------------------------------------------
 */

import { z }                          from 'zod';
import { apiSuccess, apiError }       from '@/lib/api-helpers';
import { assertRateLimit, getClientIP } from '@/lib/security/rate-limit';
import { createAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/auth/session';
import { createServiceRoleClient }    from '@/lib/supabase/service';
import { createClient }               from '@/lib/supabase/server';
import { buildAuditEntry }            from '@/lib/api-helpers';
import { createMfaChallengeToken }    from '@/app/api/admin/mfa/verify/route';

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const adminLoginSchema = z.object({
  email:    z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIP(request);
  const ua = request.headers.get('user-agent') ?? '';

  // 1. Rate limit
  const rateLimitError = await assertRateLimit('auth:login', ip);
  if (rateLimitError) return rateLimitError;

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? 'Validation failed.', 400, parsed.error.issues);
  }

  const { email, password } = parsed.data;

  const db = createServiceRoleClient();

  // ---------------------------------------------------------------------------
  // 3. Production: sign in via Supabase Auth, look up admin_users record
  // ---------------------------------------------------------------------------
  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      await db.from('audit_logs').insert(
        buildAuditEntry({
          action:    'admin.login.failed',
          actorType: 'system',
          details:   { email, reason: authError?.message ?? 'No user returned' },
          request,
        })
      );
      return apiError('Invalid email or password.', 401);
    }

    // Look up the admin_users record for this Supabase Auth user.
    const { data: adminUser, error: adminError } = await db
      .from('admin_users')
      .select('id, role, is_active, totp_enabled')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      await db.from('audit_logs').insert(
        buildAuditEntry({
          action:    'admin.login.failed',
          actorType: 'system',
          details:   { email, reason: 'Not an admin user' },
          request,
        })
      );
      return apiError('Access denied. Admin privileges required.', 403);
    }

    if (!adminUser.is_active) {
      await db.from('audit_logs').insert(
        buildAuditEntry({
          action:    'admin.login.failed',
          actorType: 'admin',
          actorId:   adminUser.id,
          details:   { email, reason: 'Account inactive' },
          request,
        })
      );
      return apiError('Admin account is inactive. Contact a super_admin.', 403);
    }

    const admin = adminUser as { id: string; role: string; is_active: boolean; totp_enabled: boolean };

    // 4. MFA gate — if TOTP is enabled, return a short-lived challenge token
    //    instead of a full session. The client must complete /api/admin/mfa/verify.
    if (admin.totp_enabled) {
      const mfaToken = createMfaChallengeToken(admin.id);
      return apiSuccess({ mfa_required: true, mfa_token: mfaToken });
    }

    // 5. Create admin session (no MFA)
    const token = await createAdminSession(admin.id, ip, ua);
    const cookieValue = buildSessionCookie(token);

    // 6. Audit log
    await db.from('audit_logs').insert(
      buildAuditEntry({
        action:    'admin.login.success',
        actorType: 'admin',
        actorId:   admin.id,
        details:   { email, role: admin.role },
        request,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          admin: {
            id:    admin.id,
            email: authData.user.email,
            role:  admin.role,
            name:  authData.user.user_metadata?.full_name ?? email,
          },
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie':   cookieValue,
        },
      }
    );
  } catch (err) {
    console.error('[admin/login] Unexpected error:', err);
    return apiError('Login service temporarily unavailable.', 503);
  }
}

// ---------------------------------------------------------------------------
// Helper: build the __admin_session Set-Cookie header value
// ---------------------------------------------------------------------------

function buildSessionCookie(token: string): string {
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'HttpOnly',
    // Secure must be false on plain HTTP localhost or the browser will silently
    // discard the cookie.  In production (HTTPS) it must always be set.
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    'SameSite=Strict',
    'Path=/admin',
    'Max-Age=28800', // 8 hours
  ];
  return parts.join('; ');
}
