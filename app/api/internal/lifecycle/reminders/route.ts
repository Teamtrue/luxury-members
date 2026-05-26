/**
 * app/api/internal/lifecycle/reminders/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/lifecycle/reminders
 *
 * Cron job (runs daily): queue lifecycle reminder notifications.
 *   - Membership renewal reminders at 30, 7, and 1 day before expiry
 *   - PC Token expiry reminders for tokens earned > 11 months ago
 *     (tokens expire at 12 months from earn date per PlutusClub T&C)
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 * Idempotent: checks for existing queued notifications of the same type
 *             before inserting to prevent duplicate sends.
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
// Reminder window definitions
// ---------------------------------------------------------------------------

interface ReminderWindow {
  templateName: string;
  daysBeforeExpiry: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const MEMBERSHIP_REMINDER_WINDOWS: ReminderWindow[] = [
  { templateName: 'MEMBERSHIP_RENEWAL_REMINDER',  daysBeforeExpiry: 30, priority: 'medium' },
  { templateName: 'MEMBERSHIP_RENEWAL_7DAY',       daysBeforeExpiry: 7,  priority: 'high'   },
  { templateName: 'MEMBERSHIP_RENEWAL_FINAL',      daysBeforeExpiry: 1,  priority: 'critical' },
];

// ---------------------------------------------------------------------------
// POST /api/internal/lifecycle/reminders
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db  = createServiceRoleClient();
  const now = new Date();
  let queued = 0;

  try {
    // =======================================================================
    // 1. Membership renewal reminders (30d, 7d, 1d before expiry)
    // =======================================================================
    for (const window of MEMBERSHIP_REMINDER_WINDOWS) {
      const windowStart = new Date(
        now.getTime() + (window.daysBeforeExpiry - 0.5) * 24 * 60 * 60 * 1000
      ).toISOString();
      const windowEnd = new Date(
        now.getTime() + (window.daysBeforeExpiry + 0.5) * 24 * 60 * 60 * 1000
      ).toISOString();

      // Find active memberships expiring in this window
      const { data: expiringMemberships, error: queryError } = await db
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

      if (queryError) {
        console.error(
          `[internal/lifecycle/reminders] query error for ${window.templateName}:`,
          queryError.message
        );
        continue;
      }

      for (const membership of expiringMemberships ?? []) {
        try {
          // Idempotency: check for existing queued notification of this type
          const { data: existing } = await db
            .from('notifications')
            .select('id')
            .eq('user_id', membership.user_id)
            .eq('template_name', window.templateName)
            .in('status', ['queued', 'sent'])
            .maybeSingle();

          if (existing) continue; // already sent/queued, skip

          const plan = Array.isArray(membership.membership_plans)
            ? membership.membership_plans[0]
            : membership.membership_plans;

          await db.from('notifications').insert({
            user_id:       membership.user_id,
            channel:       'email',
            template_name: window.templateName,
            template_data: {
              membership_id:    membership.id,
              expires_at:       membership.expires_at,
              plan_name:        (plan as { name?: string })?.name ?? 'Silver',
              plan_slug:        (plan as { slug?: string })?.slug ?? 'silver',
              days_before:      window.daysBeforeExpiry,
            },
            status:         'queued',
            priority:       window.priority,
            scheduled_for:  now.toISOString(),
          });

          queued++;
        } catch (itemErr) {
          console.error(
            `[internal/lifecycle/reminders] error queuing ${window.templateName} for membership`,
            membership.id,
            itemErr
          );
        }
      }
    }

    // =======================================================================
    // 2. PC Token expiry reminders
    //    Tokens older than 11 months (expiry at 12 months) should get reminders.
    //    We identify members who earned tokens between 11–12 months ago and
    //    still have an outstanding balance.
    // =======================================================================

    const elevenMonthsAgo = new Date(now);
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);

    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Find distinct users who earned tokens in the 11–12 month window
    const { data: expiringTokenTx, error: tokenQueryError } = await db
      .from('token_transactions')
      .select('user_id, amount, created_at')
      .in('type', ['earned', 'bonus'])
      .gte('created_at', twelveMonthsAgo.toISOString())
      .lte('created_at', elevenMonthsAgo.toISOString());

    if (tokenQueryError) {
      console.error(
        '[internal/lifecycle/reminders] token query error:',
        tokenQueryError.message
      );
    } else {
      // Aggregate by user
      const userTokens: Record<string, number> = {};
      for (const tx of expiringTokenTx ?? []) {
        const uid = tx.user_id as string;
        userTokens[uid] = (userTokens[uid] ?? 0) + (tx.amount as number);
      }

      for (const [userId, expiringAmount] of Object.entries(userTokens)) {
        if (expiringAmount <= 0) continue;

        try {
          // Idempotency check
          const { data: existing } = await db
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('template_name', 'TOKEN_EXPIRY_REMINDER')
            .in('status', ['queued', 'sent'])
            // Only within the current month (avoid yearly duplicates)
            .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
            .maybeSingle();

          if (existing) continue;

          const expiresAt = new Date(twelveMonthsAgo);
          expiresAt.setMonth(expiresAt.getMonth() + 12);

          await db.from('notifications').insert({
            user_id:       userId,
            channel:       'email',
            template_name: 'TOKEN_EXPIRY_REMINDER',
            template_data: {
              expiring_tokens: expiringAmount,
              expires_at:      expiresAt.toISOString(),
            },
            status:         'queued',
            priority:       'medium',
            scheduled_for:  now.toISOString(),
          });

          queued++;
        } catch (itemErr) {
          console.error(
            '[internal/lifecycle/reminders] error queuing token reminder for user',
            userId,
            itemErr
          );
        }
      }
    }

    // Audit log the cron run
    await db.from('audit_logs').insert(
      buildAuditEntry({
        action:    'cron.lifecycle_reminders.ran',
        actorType: 'system',
        details:   { queued, ran_at: now.toISOString() },
      })
    );

    return apiSuccess({
      queued,
      ran_at: now.toISOString(),
    });
  } catch (err) {
    console.error('[internal/lifecycle/reminders] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
