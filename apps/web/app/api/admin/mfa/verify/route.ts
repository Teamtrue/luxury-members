/**
 * POST /api/admin/mfa/verify
 * ---------------------------------------------------------------------------
 * Step 2 of admin login when MFA is enabled.
 *
 * Client sends { mfa_token, code } where:
 *   mfa_token — short-lived HMAC-signed challenge token returned by
 *               /api/admin/login when totp_enabled = true.
 *   code      — 6-digit TOTP code (or 8-digit backup code).
 *
 * On success, creates a full admin session and sets the session cookie.
 * ---------------------------------------------------------------------------
 */

import { z }                              from 'zod';
import { apiSuccess, apiError }           from '@/lib/api-helpers';
import { assertRateLimit, getClientIP }   from '@/lib/security/rate-limit';
import { createServiceRoleClient }        from '@/lib/supabase/service';
import { createAdminSession,
         ADMIN_SESSION_COOKIE }           from '@/lib/auth/session';
import { verifyTotp }                     from '@/lib/auth/totp';
import { decrypt }                        from '@/lib/security/encrypt';
import { logAudit }                       from '@/lib/audit';
import crypto                             from 'crypto';

const schema = z.object({
  mfa_token: z.string().min(1),
  code:      z.string().min(6).max(8).regex(/^\d+$/, 'Code must be numeric.'),
});

const MFA_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// MFA challenge token helpers (HMAC-SHA256 signed, no external JWT dep)
// ---------------------------------------------------------------------------

export function createMfaChallengeToken(adminUserId: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error('APP_SECRET is required.');

  const payload = JSON.stringify({ sub: adminUserId, exp: Date.now() + MFA_TOKEN_TTL_MS, purpose: 'mfa_challenge' });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyMfaChallengeToken(token: string): { adminUserId: string } | null {
  const secret = process.env.APP_SECRET;
  if (!secret) return null;

  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const sigBufA = Buffer.from(sig,         'base64url');
  const sigBufB = Buffer.from(expectedSig, 'base64url');
  if (sigBufA.length !== sigBufB.length) return null;
  if (!crypto.timingSafeEqual(sigBufA, sigBufB)) return null;

  let payload: { sub: string; exp: number; purpose: string };
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as typeof payload;
  } catch {
    return null;
  }

  if (payload.purpose !== 'mfa_challenge') return null;
  if (Date.now() > payload.exp) return null;

  return { adminUserId: payload.sub };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIP(request);
  const ua = request.headers.get('user-agent') ?? '';

  // Rate-limit MFA attempts — same bucket as login
  const rateLimitError = await assertRateLimit('auth:login', ip);
  if (rateLimitError) return rateLimitError;

  let body: unknown;
  try { body = await request.json(); } catch { return apiError('Invalid JSON.', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Validation failed.', 400);

  const { mfa_token, code } = parsed.data;

  // Verify challenge token
  const challenge = verifyMfaChallengeToken(mfa_token);
  if (!challenge) {
    return apiError('MFA challenge expired or invalid. Please log in again.', 401);
  }

  const db = createServiceRoleClient();

  const { data: adminUser } = await db
    .from('admin_users')
    .select('id, role, is_active, totp_enabled, totp_secret_encrypted, totp_backup_codes')
    .eq('id', challenge.adminUserId)
    .single();

  if (!adminUser) return apiError('Admin not found.', 401);

  const u = adminUser as {
    id: string;
    role: string;
    is_active: boolean;
    totp_enabled: boolean;
    totp_secret_encrypted: string | null;
    totp_backup_codes: string[];
  };

  if (!u.is_active) return apiError('Admin account is inactive.', 403);
  if (!u.totp_enabled || !u.totp_secret_encrypted) return apiError('MFA not configured.', 400);

  let secret: string;
  try {
    secret = decrypt(u.totp_secret_encrypted);
  } catch {
    console.error('[mfa/verify] Failed to decrypt TOTP secret for admin', u.id);
    return apiError('MFA verification failed.', 500);
  }

  let codeValid = false;

  if (code.length === 6) {
    // Regular TOTP
    codeValid = verifyTotp(secret, code);
  } else if (code.length === 8) {
    // Backup code — hash and check against stored hashes
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const idx = u.totp_backup_codes.indexOf(codeHash);
    if (idx !== -1) {
      codeValid = true;
      // Remove used backup code (one-time use)
      const remaining = u.totp_backup_codes.filter((_, i) => i !== idx);
      await db
        .from('admin_users')
        .update({ totp_backup_codes: remaining })
        .eq('id', u.id);
    }
  }

  if (!codeValid) {
    await logAudit({
      action:     'admin.mfa.failed',
      actor_type: 'admin',
      actor_id:   u.id,
      details:    { ip },
      ip_address: ip,
    });
    return apiError('Invalid MFA code.', 401);
  }

  // Create full admin session
  const token       = await createAdminSession(u.id, ip, ua);
  const cookieParts = [
    `${ADMIN_SESSION_COOKIE}=${token}`,
    'HttpOnly',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    'SameSite=Strict',
    'Path=/admin',
    'Max-Age=28800',
  ];

  await logAudit({
    action:     'admin.login.success',
    actor_type: 'admin',
    actor_id:   u.id,
    details:    { mfa: true, code_type: code.length === 8 ? 'backup' : 'totp' },
    ip_address: ip,
  });

  return new Response(
    JSON.stringify({ success: true, data: { admin: { id: u.id, role: u.role } } }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieParts.join('; ') },
    }
  );
}
