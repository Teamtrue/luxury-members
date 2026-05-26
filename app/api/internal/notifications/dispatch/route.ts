/**
 * app/api/internal/notifications/dispatch/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/notifications/dispatch
 *
 * Cron job: dequeue and send up to 50 pending notifications per run.
 * Processes in descending priority order: critical > high > medium > low.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError }                     from '@/lib/api-helpers';
import { createServiceRoleClient }                  from '@/lib/supabase/service';
import { getSMSProvider, getEmailProvider }         from '@/lib/providers';
import { ProviderNotConfiguredError }               from '@/lib/providers/types';

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
// Priority ordering for DB query
// ---------------------------------------------------------------------------

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// POST /api/internal/notifications/dispatch
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db = createServiceRoleClient();
  const now = new Date().toISOString();

  let dispatched = 0;
  let failed     = 0;

  try {
    // Fetch up to 50 queued notifications due for delivery
    const { data: notifications, error: fetchError } = await db
      .from('notifications')
      .select('id, user_id, channel, template_name, template_data, attempt_count, priority')
      .eq('status', 'queued')
      .lte('scheduled_for', now)
      .order('priority', { ascending: true }) // critical = first alphabetically? use index
      .limit(50);

    if (fetchError) {
      console.error('[internal/notifications/dispatch] fetch error:', fetchError.message);
      return apiError('Failed to fetch notifications.', 500);
    }

    // Sort by priority weight (critical first)
    const priorityWeight: Record<string, number> = {
      critical: 0, high: 1, medium: 2, low: 3,
    };
    const sorted = [...(notifications ?? [])].sort(
      (a, b) =>
        (priorityWeight[a.priority as string] ?? 99) -
        (priorityWeight[b.priority as string] ?? 99)
    );

    for (const notif of sorted) {
      const attemptCount = (notif.attempt_count as number) + 1;

      try {
        // Resolve template to subject/body
        const rendered = renderTemplate(
          notif.template_name as string,
          notif.template_data as Record<string, unknown>
        );

        if (notif.channel === 'sms') {
          const smsProvider = await getSMSProvider();
          // Get user phone number
          const { data: profile } = await db
            .from('user_profiles')
            .select('phone')
            .eq('id', notif.user_id)
            .maybeSingle();

          const phone = profile?.phone as string | null;
          if (!phone) throw new Error('No phone number for user');

          await smsProvider.sendTransactional({
            phone,
            message: rendered.text ?? rendered.subject,
          });
        } else if (notif.channel === 'email') {
          const emailProvider = await getEmailProvider();
          // Get user email
          const { data: authUser } = await db.auth.admin.getUserById(
            notif.user_id as string
          );
          const email = authUser?.user?.email;
          if (!email) throw new Error('No email for user');

          await emailProvider.sendEmail({
            to:      email,
            subject: rendered.subject,
            html:    rendered.html ?? rendered.text ?? rendered.subject,
            text:    rendered.text,
          });
        } else {
          // push / in_app — not yet implemented; mark as skipped
          await db
            .from('notifications')
            .update({ status: 'skipped', last_attempted_at: now, attempt_count: attemptCount })
            .eq('id', notif.id);
          continue;
        }

        // Mark as sent
        await db
          .from('notifications')
          .update({
            status:            'sent',
            sent_at:           now,
            last_attempted_at: now,
            attempt_count:     attemptCount,
            error_message:     null,
          })
          .eq('id', notif.id);

        dispatched++;
      } catch (sendErr) {
        const errMsg =
          sendErr instanceof ProviderNotConfiguredError
            ? sendErr.message
            : sendErr instanceof Error
            ? sendErr.message
            : 'Unknown send error';

        console.error(
          `[internal/notifications/dispatch] send error (id=${notif.id}):`,
          errMsg
        );

        // Mark failed permanently after MAX_RETRIES
        const newStatus = attemptCount >= MAX_RETRIES ? 'failed' : 'queued';

        // Back off: schedule next attempt 15 min later on retry
        const nextScheduled = attemptCount < MAX_RETRIES
          ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
          : undefined;

        const updatePayload: Record<string, unknown> = {
          status:            newStatus,
          attempt_count:     attemptCount,
          last_attempted_at: now,
          error_message:     errMsg,
        };
        if (nextScheduled) updatePayload.scheduled_for = nextScheduled;

        await db.from('notifications').update(updatePayload).eq('id', notif.id);

        failed++;
      }
    }

    return apiSuccess({
      dispatched,
      failed,
      ran_at: now,
    });
  } catch (err) {
    console.error('[internal/notifications/dispatch] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}

// ---------------------------------------------------------------------------
// Simple template renderer
// ---------------------------------------------------------------------------

interface RenderedTemplate {
  subject: string;
  html?:   string;
  text?:   string;
}

function renderTemplate(
  templateName: string,
  data: Record<string, unknown>
): RenderedTemplate {
  // TODO: AI — Smart notification timing: plug in lib/ai/notification-timing.ts
  // to adjust delivery window based on member behavioural signals.

  switch (templateName) {
    case 'MEMBERSHIP_RENEWAL_REMINDER':
    case 'MEMBERSHIP_RENEWAL_URGENT':
    case 'MEMBERSHIP_EXPIRY_FINAL': {
      const { membershipRenewalReminderEmail } = require('@/lib/email-templates');
      const name       = String(data.member_name ?? 'Member');
      const expiresAt  = new Date(String(data.expires_at));
      const tier       = String(data.plan_slug ?? 'silver');
      return membershipRenewalReminderEmail(name, expiresAt, tier);
    }

    case 'TOKEN_EXPIRY_REMINDER': {
      const subject = 'Your PlutusClub PC Tokens are expiring soon';
      const text    = `Dear Member, you have ${data.expiring_tokens} PC Tokens expiring on ${data.expires_at}. Use them before they expire at https://plutusclub.in/deals`;
      return { subject, text };
    }

    case 'BOOKING_CONFIRMED': {
      const { bookingConfirmationEmail } = require('@/lib/email-templates');
      return bookingConfirmationEmail(data);
    }

    default: {
      // Fallback: use template_data as raw subject + body
      return {
        subject: String(data.subject ?? `PlutusClub notification: ${templateName}`),
        text:    String(data.body ?? ''),
      };
    }
  }
}
