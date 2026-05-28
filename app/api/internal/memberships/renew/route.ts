/**
 * app/api/internal/memberships/renew/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/memberships/renew
 *
 * Cron job (runs daily):
 *   1. Find memberships expiring in the next 3 days with auto_renew=true
 *      → For V1: queue renewal reminder email (stored payment methods not yet implemented)
 *   2. Find expired memberships (expires_at < now()) → set status='expired'
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError, buildAuditEntry } from '@/lib/api-helpers';
import { createServiceRoleClient }               from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Bearer token guard
// ---------------------------------------------------------------------------

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected) {
    // In dev without the env var, allow through with a warning.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[internal] INTERNAL_JOB_TOKEN not set — skipping auth in dev mode.');
      return null;
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Internal job token not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${expected}`) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// POST /api/internal/memberships/renew
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db = createServiceRoleClient();
  const now = new Date();

  let renewed  = 0;
  let expired  = 0;
  let errors   = 0;

  try {
    // -----------------------------------------------------------------------
    // 1. Find memberships expiring in the next 3 days with auto_renew=true
    // -----------------------------------------------------------------------
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: soonExpiring, error: soonError } = await db
      .from('memberships')
      .select(`
        id,
        user_id,
        expires_at,
        membership_plans ( name, slug, price_paise )
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('expires_at', threeDaysFromNow)
      .gte('expires_at', now.toISOString());

    if (soonError) {
      console.error('[internal/memberships/renew] soonExpiring query error:', soonError.message);
      return apiError('Failed to query expiring memberships.', 500);
    }

    // V1: queue renewal reminder notifications instead of charging
    // TODO: V2 — implement stored payment methods and auto-charge here
    for (const membership of soonExpiring ?? []) {
      try {
        const plan = Array.isArray(membership.membership_plans)
          ? membership.membership_plans[0]
          : membership.membership_plans;

        const daysUntilExpiry = Math.ceil(
          (new Date(membership.expires_at as string).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        // Determine template based on days remaining
        const templateName =
          daysUntilExpiry <= 1 ? 'MEMBERSHIP_EXPIRY_FINAL'
          : daysUntilExpiry <= 3 ? 'MEMBERSHIP_RENEWAL_URGENT'
          : 'MEMBERSHIP_RENEWAL_REMINDER';

        // Check for duplicate notification (avoid spamming)
        const { data: existingNotif } = await db
          .from('notifications')
          .select('id')
          .eq('user_id', membership.user_id)
          .eq('template_name', templateName)
          .eq('status', 'queued')
          .maybeSingle();

        if (!existingNotif) {
          await db.from('notifications').insert({
            user_id:        membership.user_id,
            channel:        'email',
            template_name:  templateName,
            template_data:  {
              membership_id: membership.id,
              expires_at:    membership.expires_at,
              plan_name:     (plan as { name?: string })?.name ?? 'Silver',
              plan_slug:     (plan as { slug?: string })?.slug ?? 'silver',
              price_paise:   (plan as { price_paise?: number })?.price_paise ?? 0,
              days_remaining: daysUntilExpiry,
            },
            status:          'queued',
            priority:        daysUntilExpiry <= 1 ? 'critical' : 'high',
            scheduled_for:   now.toISOString(),
          });
        }

        renewed++;

        await db.from('audit_logs').insert(
          buildAuditEntry({
            action:     'membership.renewal_reminder_queued',
            actorType:  'system',
            targetType: 'membership',
            targetId:   membership.id,
            details:    { user_id: membership.user_id, expires_at: membership.expires_at, days_remaining: daysUntilExpiry },
          })
        );
      } catch (itemErr) {
        console.error('[internal/memberships/renew] error processing membership:', membership.id, itemErr);
        errors++;
      }
    }

    // -----------------------------------------------------------------------
    // 2. Find and expire overdue memberships
    // -----------------------------------------------------------------------
    const { data: toExpire, error: expireQueryError } = await db
      .from('memberships')
      .select('id, user_id')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (expireQueryError) {
      console.error('[internal/memberships/renew] toExpire query error:', expireQueryError.message);
      return apiError('Failed to query memberships to expire.', 500);
    }

    for (const membership of toExpire ?? []) {
      try {
        const { error: updateError } = await db
          .from('memberships')
          .update({ status: 'expired' })
          .eq('id', membership.id);

        if (updateError) {
          console.error('[internal/memberships/renew] expire update error:', updateError.message);
          errors++;
          continue;
        }

        expired++;

        await db.from('audit_logs').insert(
          buildAuditEntry({
            action:     'membership.expired',
            actorType:  'system',
            targetType: 'membership',
            targetId:   membership.id,
            details:    { user_id: membership.user_id },
          })
        );
      } catch (itemErr) {
        console.error('[internal/memberships/renew] error expiring membership:', membership.id, itemErr);
        errors++;
      }
    }

    // Batch churn scoring for members with expiring memberships — fire-and-forget.
    const expiringUserIds = (soonExpiring ?? []).map((m: { user_id: string }) => m.user_id);
    batchUpdateChurnScores(db, expiringUserIds).catch(err =>
      console.warn('[internal/memberships/renew] Churn batch update failed (non-fatal):', err)
    );

    return apiSuccess({
      processed: (soonExpiring?.length ?? 0) + (toExpire?.length ?? 0),
      renewed,   // reminders queued
      expired,
      errors,
      ran_at:   now.toISOString(),
    });
  } catch (err) {
    console.error('[internal/memberships/renew] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}

// ---------------------------------------------------------------------------
// Churn scoring batch helper
// ---------------------------------------------------------------------------

async function batchUpdateChurnScores(
  db: ReturnType<typeof import('@/lib/supabase/service')['createServiceRoleClient']>,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;
  const { scoreChurnRisk } = await import('@/lib/ai/churn');
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  for (const userId of userIds) {
    try {
      const [membership, allBookings, bookings90d, tokenRows, referrals, concierge] = await Promise.all([
        db.from('memberships').select('expires_at, membership_plans ( slug )').eq('user_id', userId).eq('status', 'active').maybeSingle(),
        db.from('bookings').select('id').eq('user_id', userId).eq('status', 'confirmed'),
        db.from('bookings').select('id, created_at').eq('user_id', userId).eq('status', 'confirmed').gte('created_at', ninetyDaysAgo),
        db.from('token_transactions').select('amount').eq('user_id', userId),
        db.from('referrals').select('id').eq('referrer_user_id', userId).eq('status', 'active'),
        db.from('concierge_requests').select('id').eq('member_id', userId).limit(1),
      ]);

      const ms  = membership.data as Record<string, unknown> | null;
      const mp  = ms?.membership_plans as Record<string, unknown> | null;
      const tier = (Array.isArray(mp) ? mp[0]?.slug : mp?.slug) as string ?? 'silver';
      const expiresAt = ms?.expires_at as string | null ?? new Date(Date.now() + 365 * 86400000).toISOString();
      const daysUntilExpiry = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000));

      const allBk   = allBookings.data ?? [];
      const bk90    = bookings90d.data ?? [];
      const txRows  = (tokenRows.data ?? []) as { amount: number }[];
      const tokenBalance  = txRows.reduce((s, r) => s + r.amount, 0);
      const tokens90d     = txRows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);

      // Days since last booking: 0 if any booking in 90d, otherwise use 90 as a floor.
      const daysSinceLast = bk90.length > 0 ? 0 : 90;

      const score = scoreChurnRisk({
        member_id:                   userId,
        tier,
        membership_expires_at:       expiresAt,
        days_since_last_booking:     daysSinceLast,
        total_bookings_lifetime:     allBk.length,
        total_bookings_last_90_days: bk90.length,
        token_balance:               tokenBalance,
        tokens_earned_last_90_days:  tokens90d,
        referrals_active:            (referrals.data ?? []).length,
        days_until_expiry:           daysUntilExpiry,
        has_concierge_request:       (concierge.data ?? []).length > 0,
      });

      await db.from('user_profiles').update({ churn_score: score.churn_probability }).eq('id', userId);
    } catch (err) {
      console.warn('[memberships/renew] Churn score update failed for user', userId, ':', err);
    }
  }
}
