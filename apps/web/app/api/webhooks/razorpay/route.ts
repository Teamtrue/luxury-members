/**
 * POST /api/webhooks/razorpay
 * ---------------------------------------------------------------------------
 * Server-to-server webhook handler for payment gateway events.
 * Works with whatever provider is active (not Razorpay-specific despite the
 * route name which is kept for backwards-compatibility with existing webhook
 * registrations).
 *
 * Contract:
 *   - No authentication — Razorpay contacts this URL directly.
 *   - Signature is verified via the active provider's parseWebhookEvent().
 *   - Must return HTTP 200 within 5 seconds; Razorpay retries on timeout.
 *   - All DB operations are idempotent — safe to process duplicates.
 *
 * Security:
 *   - NEVER trust payload content before verifying the signature.
 *   - Raw body is read as text for signature verification (JSON.parse only after).
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getPaymentProvider }      from '@/lib/providers';
import { ProviderNotConfiguredError } from '@/lib/providers';
import { logAudit }                from '@/lib/audit';

/** Razorpay expects a response within 5 seconds; we return 200 immediately. */
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel: allow 10s for DB operations

export async function POST(request: Request): Promise<Response> {
  // 1. Read raw body as text for signature verification.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return apiError('Failed to read request body.', 400);
  }

  // 2. Extract provider-specific signature header.
  const signature =
    request.headers.get('x-razorpay-signature') ??
    request.headers.get('x-stripe-signature') ??
    request.headers.get('x-payu-signature') ??
    '';

  if (!signature) {
    console.warn('[webhook] Missing signature header');
    return apiError('Missing signature header.', 401);
  }

  // 3. Get active payment provider and parse + verify the webhook.
  let event;
  try {
    const provider = await getPaymentProvider();
    event = await provider.parseWebhookEvent(rawBody, signature);
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      console.error('[webhook] No payment provider configured');
      return apiError('Payment provider not configured.', 503);
    }
    // Invalid signature or parse error.
    console.warn('[webhook] Signature verification failed:', err);
    return apiError('Invalid webhook signature.', 401);
  }

  // 4. Return 200 immediately — process asynchronously.
  // (We keep processing synchronous here since Vercel Lambda stays alive
  // for the duration of the handler; background processing would need
  // Vercel Functions with background tasks or a queue.)

  const db = createServiceRoleClient();

  // Store the event durably before processing so it can be retried by a
  // BullMQ worker if processing fails.
  let webhookEventId: string | undefined;
  try {
    const parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    const { data: webhookEvent } = await db
      .from('webhook_events')
      .insert({
        provider:      'razorpay',
        event_type:    event.type,
        payload:       parsedBody,
        hmac_verified: true,
        status:        'processing',
      })
      .select('id')
      .single();

    webhookEventId = (webhookEvent as Record<string, unknown> | null)?.id as string | undefined;
  } catch (storeErr) {
    // Non-fatal: log but continue processing — durability is best-effort
    // until the webhook_events table is confirmed available.
    console.error('[webhook] Failed to store webhook event:', storeErr);
  }

  try {
    switch (event.type) {
      case 'payment.captured': {
        await handlePaymentCaptured(db, event, request);
        break;
      }
      case 'payment.failed': {
        await handlePaymentFailed(db, event, request);
        break;
      }
      case 'refund.processed': {
        await handleRefundProcessed(db, event, request);
        break;
      }
      default: {
        // Log unknown events for observability.
        console.log(`[webhook] Unhandled event type: ${event.type}`);
      }
    }

    // Mark the stored event as processed.
    if (webhookEventId) {
      await db
        .from('webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', webhookEventId);
    }
  } catch (err) {
    // Log but do NOT return 5xx — gateway would retry indefinitely.
    console.error('[webhook] Event processing error:', err);

    // Mark the stored event as failed for BullMQ retry.
    if (webhookEventId) {
      await db
        .from('webhook_events')
        .update({ status: 'failed', last_error: String(err) })
        .eq('id', webhookEventId);
    }
  }

  return apiSuccess({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handlePaymentCaptured(
  db: ReturnType<typeof createServiceRoleClient>,
  event: { orderId?: string; paymentId?: string; amountPaise?: number; raw: Record<string, unknown> },
  request: Request
): Promise<void> {
  const orderId   = event.orderId;
  const paymentId = event.paymentId;

  if (!orderId) {
    console.warn('[webhook] payment.captured missing orderId');
    return;
  }

  // Idempotency: check if this event was already processed.
  const { data: existingAudit } = await db
    .from('audit_logs')
    .select('id')
    .eq('action', 'payment.webhook_received')
    .eq('details->>' + 'order_id', orderId)
    .eq('details->>' + 'event', 'payment.captured')
    .maybeSingle();

  if (existingAudit) {
    console.log(`[webhook] payment.captured already processed for order ${orderId}`);
    return;
  }

  // Find payment record.
  const { data: payment } = await db
    .from('payments')
    .select('id, booking_id, user_id, status, amount_paise')
    .eq('provider_order_id', orderId)
    .maybeSingle();

  if (!payment) {
    console.warn(`[webhook] payment.captured: no payment found for order ${orderId}`);
    await logAudit({
      action:      'payment.webhook_received',
      actor_type:  'system',
      details:     { event: 'payment.captured', order_id: orderId, result: 'payment_not_found' },
    });
    return;
  }

  const p = payment as Record<string, unknown>;

  // Idempotency: skip if already captured.
  if (p.status === 'captured') {
    await logAudit({
      action:      'payment.webhook_received',
      actor_type:  'system',
      details:     { event: 'payment.captured', order_id: orderId, result: 'already_captured' },
    });
    return;
  }

  // Update payment to captured.
  await db
    .from('payments')
    .update({
      status:              'captured',
      provider_payment_id: paymentId ?? null,
    })
    .eq('id', p.id);

  // Confirm booking if present.
  const bookingId = p.booking_id as string | null;
  if (bookingId) {
    const { data: booking } = await db
      .from('bookings')
      .select('id, booking_ref, status, tokens_earned, user_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (booking && (booking as Record<string, unknown>).status === 'pending') {
      const bk = booking as Record<string, unknown>;

      await db
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
        .eq('status', 'pending');

      // Credit tokens if not already credited.
      const tokensEarned = bk.tokens_earned as number;
      if (tokensEarned > 0) {
        // Check if tokens already credited for this booking.
        const { data: existingTx } = await db
          .from('token_transactions')
          .select('id')
          .eq('user_id', bk.user_id as string)
          .eq('reference_type', 'booking')
          .eq('reference_id', bookingId)
          .eq('type', 'earned')
          .maybeSingle();

        if (!existingTx) {
          const { data: tokenRows } = await db
            .from('token_transactions')
            .select('amount')
            .eq('user_id', bk.user_id as string);

          const currentBalance = (tokenRows ?? []).reduce(
            (sum: number, row: { amount: number }) => sum + row.amount,
            0
          );

          await db.from('token_transactions').insert({
            user_id:        bk.user_id,
            type:           'earned',
            amount:         tokensEarned,
            balance_after:  currentBalance + tokensEarned,
            reference_type: 'booking',
            reference_id:   bookingId,
            description:    `Tokens earned on booking ${bk.booking_ref} (webhook)`,
          });
        }
      }

      // Queue booking confirmation notification
      if (bk?.user_id) {
        await db.from('notifications').insert({
          user_id:       bk.user_id,
          channel:       'email',
          template_name: 'BOOKING_CONFIRMED',
          template_data: {
            booking_ref: bk.booking_ref,
          },
          priority:      'high',
          status:        'queued',
          scheduled_for: new Date().toISOString(),
        }).then(() => undefined);
      }
    }
  }

  await logAudit({
    action:      'payment.webhook_received',
    actor_type:  'system',
    target_type: 'payment',
    target_id:   p.id as string,
    details:     { event: 'payment.captured', order_id: orderId, payment_id: paymentId },
  });
}

async function handlePaymentFailed(
  db: ReturnType<typeof createServiceRoleClient>,
  event: { orderId?: string; paymentId?: string; raw: Record<string, unknown> },
  _request: Request
): Promise<void> {
  const orderId = event.orderId;
  if (!orderId) return;

  const { data: payment } = await db
    .from('payments')
    .select('id, booking_id, status')
    .eq('provider_order_id', orderId)
    .maybeSingle();

  if (!payment) {
    console.warn(`[webhook] payment.failed: no payment for order ${orderId}`);
    return;
  }

  const p = payment as Record<string, unknown>;

  if (p.status !== 'created' && p.status !== 'authorized') {
    return; // Already in terminal state.
  }

  await db
    .from('payments')
    .update({ status: 'failed' })
    .eq('id', p.id);

  if (p.booking_id) {
    await db
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: 'Payment failed' })
      .eq('id', p.booking_id as string)
      .eq('status', 'pending');
  }

  await logAudit({
    action:      'payment.failed',
    actor_type:  'system',
    target_type: 'payment',
    target_id:   p.id as string,
    details:     { event: 'payment.failed', order_id: orderId },
  });
}

async function handleRefundProcessed(
  db: ReturnType<typeof createServiceRoleClient>,
  event: { refundId?: string; orderId?: string; amountPaise?: number; raw: Record<string, unknown> },
  _request: Request
): Promise<void> {
  const refundId = event.refundId;
  if (!refundId) return;

  // Update refund record if it exists.
  const { data: refund } = await db
    .from('refunds')
    .select('id')
    .eq('provider_refund_id', refundId)
    .maybeSingle();

  if (refund) {
    await db
      .from('refunds')
      .update({ status: 'paid', processed_at: new Date().toISOString() })
      .eq('id', (refund as Record<string, unknown>).id as string);
  }

  await logAudit({
    action:      'payment.webhook_received',
    actor_type:  'system',
    details:     { event: 'refund.processed', refund_id: refundId },
  });
}
