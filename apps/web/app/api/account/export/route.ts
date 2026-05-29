/**
 * GET /api/account/export — GDPR data portability (full member data export)
 *
 * Exports all personal data held about the authenticated member as a
 * downloadable JSON file. Rate-limited to once per 24 hours via audit_logs.
 *
 * Flow:
 *   1. requireAuth
 *   2. Check audit_logs for a recent 'account.data_exported' event (24 h window)
 *   3. logAudit 'account.data_exported'
 *   4. Parallel queries for all data categories
 *   5. Build and return JSON attachment response
 */

import { requireAuth, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { logAudit }               from '@/lib/audit';
import { brand }                  from '@/lib/brand';

// ---------------------------------------------------------------------------
// GET /api/account/export
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const db = createServiceRoleClient();

  // Rate-limit: one export per 24 hours, enforced via audit_logs.
  const { data: recentExport, error: rateLimitError } = await db
    .from('audit_logs')
    .select('id')
    .eq('actor_id', user.id)
    .eq('action', 'account.data_exported')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();

  if (rateLimitError) {
    console.error('[GET /api/account/export] rate limit check error:', rateLimitError.message);
    return apiError('Failed to verify export eligibility.', 500);
  }
  if (recentExport) {
    return apiError('You can only export your data once per 24 hours.', 429);
  }

  // Audit before gathering data so the timestamp is accurate.
  await logAudit({
    action:     'account.data_exported',
    actor_type: 'member',
    actor_id:   user.id,
    details:    {},
  });

  // Parallel data fetch across all tables that may hold member data.
  const [
    profileResult,
    membershipsResult,
    bookingsResult,
    paymentsResult,
    tokensResult,
    referralsResult,
    conciergeResult,
    disputesResult,
    refundsResult,
    notificationsResult,
  ] = await Promise.all([
    db.from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(),

    db.from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    db.from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),

    db.from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),

    db.from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500),

    db.from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false }),

    db.from('concierge_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    db.from('payment_disputes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    db.from('refunds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),

    db.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Log any DB errors but still return partial data rather than failing entirely.
  if (profileResult.error)       console.error('[GET /api/account/export] profile error:', profileResult.error.message);
  if (membershipsResult.error)   console.error('[GET /api/account/export] memberships error:', membershipsResult.error.message);
  if (bookingsResult.error)      console.error('[GET /api/account/export] bookings error:', bookingsResult.error.message);
  if (paymentsResult.error)      console.error('[GET /api/account/export] payments error:', paymentsResult.error.message);
  if (tokensResult.error)        console.error('[GET /api/account/export] tokens error:', tokensResult.error.message);
  if (referralsResult.error)     console.error('[GET /api/account/export] referrals error:', referralsResult.error.message);
  if (conciergeResult.error)     console.error('[GET /api/account/export] concierge error:', conciergeResult.error.message);
  if (disputesResult.error)      console.error('[GET /api/account/export] disputes error:', disputesResult.error.message);
  if (refundsResult.error)       console.error('[GET /api/account/export] refunds error:', refundsResult.error.message);
  if (notificationsResult.error) console.error('[GET /api/account/export] notifications error:', notificationsResult.error.message);

  const exportedAt = new Date().toISOString();
  const dateLabel  = exportedAt.slice(0, 10); // YYYY-MM-DD

  const exportPayload = {
    exported_at:        exportedAt,
    user:               profileResult.data    ?? null,
    memberships:        membershipsResult.data ?? [],
    bookings:           bookingsResult.data    ?? [],
    payments:           paymentsResult.data    ?? [],
    tokens: {
      transactions:     tokensResult.data      ?? [],
    },
    referrals:          referralsResult.data   ?? [],
    concierge_requests: conciergeResult.data   ?? [],
    disputes:           disputesResult.data    ?? [],
    refunds:            refundsResult.data     ?? [],
    notifications:      notificationsResult.data ?? [],
  };

  const json = JSON.stringify(exportPayload, null, 2);

  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${brand.slug}-data-export-${dateLabel}.json"`,
    },
  });
}
