/**
 * app/api/internal/membership/lifecycle/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/membership/lifecycle
 *
 * Cron job (runs daily): full membership lifecycle pass.
 *
 *   A. Expire memberships — find active memberships past their expires_at,
 *      mark them expired, queue a final expiry notification, and log to audit.
 *
 *   B. Send renewal reminders — queue email notifications for memberships
 *      expiring in 7–8 days (MEMBERSHIP_RENEWAL_REMINDER) and 1–2 days
 *      (MEMBERSHIP_RENEWAL_URGENT).
 *
 *   C. Expire PC Tokens — find token credit rows whose expires_at has passed
 *      and cancel the unspent value by inserting a matching debit transaction
 *      of type 'expired' with reference_type 'expiry'.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError, buildAuditEntry } from '@/lib/api-helpers';
import { createServiceRoleClient }               from '@/lib/supabase/service';
import { scoreChurnRisk }                        from '@/lib/ai/churn';

// ---------------------------------------------------------------------------
// Bearer token guard — same pattern as other internal routes
// ---------------------------------------------------------------------------

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;

  if (!expected) {
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
// POST /api/internal/membership/lifecycle
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db  = createServiceRoleClient();
  const now = new Date();
  const nowIso = now.toISOString();

  let expired_memberships = 0;
  let reminders_sent      = 0;
  let tokens_expired      = 0;
  let churn_scored        = 0;

  try {
    // =========================================================================
    // A. Expire memberships whose expires_at has passed
    // =========================================================================

    const { data: toExpire, error: expireQueryError } = await db
      .from('memberships')
      .select(`
        id,
        user_id,
        expires_at,
        membership_plans ( name, slug )
      `)
      .eq('status', 'active')
      .lt('expires_at', nowIso);

    if (expireQueryError) {
      console.error('[lifecycle] A: expiry query error:', expireQueryError.message);
      return apiError('Failed to query memberships for expiry.', 500);
    }

    for (const membership of toExpire ?? []) {
      try {
        // Mark membership as expired
        const { error: updateErr } = await db
          .from('memberships')
          .update({ status: 'expired' })
          .eq('id', membership.id);

        if (updateErr) {
          console.error('[lifecycle] A: update status error:', membership.id, updateErr.message);
          continue;
        }

        // Queue final expiry notification
        await db.from('notifications').insert({
          user_id:       membership.user_id,
          channel:       'email',
          template_name: 'MEMBERSHIP_EXPIRY_FINAL',
          template_data: {
            membership_id: membership.id,
            expires_at:    membership.expires_at,
            plan_name:     (membership.membership_plans as { name?: string } | null)?.name ?? 'Silver',
            plan_slug:     (membership.membership_plans as { slug?: string } | null)?.slug ?? 'silver',
            member_name:   null, // resolved by dispatch worker from user_profiles
          },
          status:        'queued',
          priority:      'high',
          scheduled_for: nowIso,
        });

        // Audit trail
        await db.from('audit_logs').insert(
          buildAuditEntry({
            action:     'membership.expired',
            actorType:  'system',
            targetType: 'membership',
            targetId:   membership.id as string,
            details: {
              user_id:    membership.user_id,
              expires_at: membership.expires_at,
              plan_slug:  (membership.membership_plans as { slug?: string } | null)?.slug ?? 'silver',
            },
          })
        );

        expired_memberships++;
      } catch (itemErr) {
        console.error('[lifecycle] A: error expiring membership:', membership.id, itemErr);
      }
    }

    // =========================================================================
    // B. Renewal reminders
    //    7–8 days out  → MEMBERSHIP_RENEWAL_REMINDER (priority: medium)
    //    1–2 days out  → MEMBERSHIP_RENEWAL_URGENT   (priority: high)
    // =========================================================================

    const windows = [
      {
        fromDays:     7,
        toDays:       8,
        templateName: 'MEMBERSHIP_RENEWAL_REMINDER',
        priority:     'medium',
      },
      {
        fromDays:     1,
        toDays:       2,
        templateName: 'MEMBERSHIP_RENEWAL_URGENT',
        priority:     'high',
      },
    ] as const;

    for (const window of windows) {
      const windowStart = new Date(now.getTime() + window.fromDays * 24 * 60 * 60 * 1000).toISOString();
      const windowEnd   = new Date(now.getTime() + window.toDays   * 24 * 60 * 60 * 1000).toISOString();

      const { data: upcoming, error: upcomingErr } = await db
        .from('memberships')
        .select(`
          id,
          user_id,
          expires_at,
          membership_plans ( name, slug )
        `)
        .eq('status', 'active')
        .gte('expires_at', windowStart)
        .lte('expires_at', windowEnd);

      if (upcomingErr) {
        console.error(
          `[lifecycle] B: reminder query error (${window.templateName}):`,
          upcomingErr.message
        );
        continue;
      }

      for (const membership of upcoming ?? []) {
        try {
          // Dedup: skip if an identical queued notification already exists
          const { data: existing } = await db
            .from('notifications')
            .select('id')
            .eq('user_id', membership.user_id)
            .eq('template_name', window.templateName)
            .eq('status', 'queued')
            .maybeSingle();

          if (existing) continue;

          const plan = membership.membership_plans as
            | { name?: string; slug?: string }
            | null;

          await db.from('notifications').insert({
            user_id:       membership.user_id,
            channel:       'email',
            template_name: window.templateName,
            template_data: {
              membership_id: membership.id,
              expires_at:    membership.expires_at,
              member_name:   null, // resolved by dispatch worker
              plan_name:     plan?.name ?? 'Silver',
              plan_slug:     plan?.slug ?? 'silver',
            },
            status:        'queued',
            priority:      window.priority,
            scheduled_for: nowIso,
          });

          reminders_sent++;
        } catch (itemErr) {
          console.error(
            `[lifecycle] B: error queuing reminder (${window.templateName}):`,
            membership.id,
            itemErr
          );
        }
      }
    }

    // =========================================================================
    // C. Expire PC Tokens
    //
    // token_transactions is an append-only ledger.  When a credit row's
    // expires_at has passed we insert a matching 'expired' debit row to
    // cancel the unspent tokens and update the member's balance snapshot.
    //
    // We only expire rows that:
    //   • type = 'earned' | 'bonus'  (credit rows)
    //   • expires_at < now()          (window has closed)
    //   • amount > 0                  (still a positive credit — sanity check)
    //
    // To avoid double-expiry on subsequent cron runs we check that no existing
    // 'expired' debit row already references this credit row's id.
    // =========================================================================

    const { data: expiredTokenRows, error: tokenQueryErr } = await db
      .from('token_transactions')
      .select('id, user_id, amount, balance_after')
      .in('type', ['earned', 'bonus'])
      .lt('expires_at', nowIso)
      .gt('amount', 0);

    if (tokenQueryErr) {
      console.error('[lifecycle] C: token query error:', tokenQueryErr.message);
      // Non-fatal — return partial results rather than failing the whole job.
    } else {
      for (const credit of expiredTokenRows ?? []) {
        try {
          // Check for an existing expiry debit that references this credit row
          const { data: alreadyExpired } = await db
            .from('token_transactions')
            .select('id')
            .eq('type', 'expired')
            .eq('reference_id', credit.id)
            .eq('reference_type', 'expiry')
            .maybeSingle();

          if (alreadyExpired) continue; // already cancelled on a previous run

          // Fetch the user's current token balance (latest balance_after)
          const { data: latestTx } = await db
            .from('token_transactions')
            .select('balance_after')
            .eq('user_id', credit.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const currentBalance = (latestTx?.balance_after as number | null) ?? 0;
          const debitAmount    = Math.min(credit.amount, currentBalance); // never go negative
          const balanceAfter   = currentBalance - debitAmount;

          if (debitAmount <= 0) continue; // nothing to expire

          // Insert expiry debit row
          const { error: insertErr } = await db.from('token_transactions').insert({
            user_id:        credit.user_id,
            type:           'expired',
            amount:         -debitAmount,
            balance_after:  balanceAfter,
            reference_type: 'expiry',
            reference_id:   credit.id,
            description:    `PC Tokens expired (original credit ${credit.id})`,
          });

          if (insertErr) {
            console.error('[lifecycle] C: token expiry insert error:', credit.id, insertErr.message);
            continue;
          }

          // Audit
          await db.from('audit_logs').insert(
            buildAuditEntry({
              action:     'tokens.expired',
              actorType:  'system',
              targetType: 'token_transaction',
              targetId:   credit.id as string,
              details: {
                user_id:         credit.user_id,
                expired_amount:  debitAmount,
                balance_before:  currentBalance,
                balance_after:   balanceAfter,
                source_credit_id: credit.id,
              },
            })
          );

          tokens_expired++;
        } catch (itemErr) {
          console.error('[lifecycle] C: error expiring token credit:', credit.id, itemErr);
        }
      }
    }

    // =========================================================================
    // D. Churn scoring
    //    Score members whose memberships expire within the next 60 days.
    //    Persist the score to memberships.churn_score and queue notifications
    //    for high-risk / critical-risk members.
    // =========================================================================

    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { data: churnCandidates, error: churnQueryErr } = await db
      .from('memberships')
      .select(`
        id,
        user_id,
        expires_at,
        membership_plans ( slug )
      `)
      .eq('status', 'active')
      .gte('expires_at', nowIso)
      .lte('expires_at', sixtyDaysFromNow);

    if (churnQueryErr) {
      console.error('[lifecycle] D: churn candidates query error:', churnQueryErr.message);
      // Non-fatal — return partial results rather than failing the whole job.
    } else {
      for (const membership of churnCandidates ?? []) {
        try {
          const daysUntilExpiry = Math.max(
            0,
            Math.round(
              (new Date(membership.expires_at as string).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
            )
          );

          // ── Signal: bookings in last 90 days ──────────────────────────────
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

          const { count: bookings90d } = await db
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', membership.user_id)
            .gte('created_at', ninetyDaysAgo);

          // ── Signal: days since last booking ───────────────────────────────
          const { data: lastBookingRow } = await db
            .from('bookings')
            .select('created_at')
            .eq('user_id', membership.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const daysSinceLastBooking = lastBookingRow
            ? Math.round(
                (now.getTime() - new Date(lastBookingRow.created_at as string).getTime()) /
                (1000 * 60 * 60 * 24)
              )
            : 90; // no bookings on record → treat as 90 days

          // ── Signal: lifetime bookings ──────────────────────────────────────
          const { count: bookingsLifetime } = await db
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', membership.user_id);

          // ── Signal: token balance (latest balance_after) ───────────────────
          const { data: latestToken } = await db
            .from('token_transactions')
            .select('balance_after')
            .eq('user_id', membership.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const tokenBalance = (latestToken?.balance_after as number | null) ?? 0;

          // ── Signal: tokens earned in last 90 days ─────────────────────────
          const { data: recentTokenRows } = await db
            .from('token_transactions')
            .select('amount')
            .eq('user_id', membership.user_id)
            .in('type', ['earned', 'bonus'])
            .gte('created_at', ninetyDaysAgo);

          const tokensEarned90d = (recentTokenRows ?? []).reduce(
            (sum, r) => sum + ((r.amount as number) ?? 0),
            0
          );

          // ── Signal: active referrals ───────────────────────────────────────
          const { count: referralsActive } = await db
            .from('referrals')
            .select('id', { count: 'exact', head: true })
            .eq('referrer_id', membership.user_id)
            .eq('status', 'active');

          // ── Signal: has concierge request ─────────────────────────────────
          const { data: conciergeRow } = await db
            .from('concierge_requests')
            .select('id')
            .eq('user_id', membership.user_id)
            .limit(1)
            .maybeSingle();

          const plan = Array.isArray(membership.membership_plans)
            ? membership.membership_plans[0]
            : membership.membership_plans;
          const tierSlug = (plan as { slug?: string } | null)?.slug ?? 'silver';

          // ── Score ──────────────────────────────────────────────────────────
          const churnScore = scoreChurnRisk({
            member_id:                  membership.user_id as string,
            tier:                       tierSlug,
            membership_expires_at:      membership.expires_at as string,
            days_since_last_booking:    daysSinceLastBooking,
            total_bookings_lifetime:    bookingsLifetime ?? 0,
            total_bookings_last_90_days: bookings90d ?? 0,
            token_balance:              tokenBalance,
            tokens_earned_last_90_days: tokensEarned90d,
            referrals_active:           referralsActive ?? 0,
            days_until_expiry:          daysUntilExpiry,
            has_concierge_request:      !!conciergeRow,
          });

          // ── Persist score ──────────────────────────────────────────────────
          await db
            .from('memberships')
            .update({ churn_score: churnScore.churn_probability })
            .eq('id', membership.id);

          // ── Notifications for high-risk members ───────────────────────────
          if (churnScore.risk_level === 'critical' || churnScore.risk_level === 'high') {
            const templateName =
              churnScore.risk_level === 'critical'
                ? 'MEMBERSHIP_RENEWAL_URGENT'
                : 'MEMBERSHIP_RENEWAL_REMINDER';

            // Dedup: skip if an identical queued notification already exists
            const { data: existingNotif } = await db
              .from('notifications')
              .select('id')
              .eq('user_id', membership.user_id)
              .eq('template_name', templateName)
              .eq('status', 'queued')
              .maybeSingle();

            if (!existingNotif) {
              await db.from('notifications').insert({
                user_id:       membership.user_id,
                channel:       'email',
                template_name: templateName,
                template_data: {
                  membership_id:      membership.id,
                  expires_at:         membership.expires_at,
                  plan_name:          tierSlug,
                  plan_slug:          tierSlug,
                  member_name:        null, // resolved by dispatch worker
                  churn_risk_level:   churnScore.risk_level,
                  churn_probability:  churnScore.churn_probability,
                  recommended_action: churnScore.recommended_action,
                },
                status:        'queued',
                priority:      churnScore.risk_level === 'critical' ? 'high' : 'medium',
                scheduled_for: nowIso,
              });
            }
          }

          churn_scored++;
        } catch (itemErr) {
          console.error('[lifecycle] D: error scoring member:', membership.id, itemErr);
        }
      }
    }

    return apiSuccess({
      expired_memberships,
      reminders_sent,
      tokens_expired,
      churn_scored,
      ran_at: nowIso,
    });
  } catch (err) {
    console.error('[lifecycle] unexpected error:', err);
    return apiError('An unexpected error occurred during lifecycle processing.', 500);
  }
}
