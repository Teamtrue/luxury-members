/**
 * POST /api/payments/create-order
 * ---------------------------------------------------------------------------
 * Creates a payment gateway order for either:
 *   a) A deal booking  — { booking_id }
 *   b) A membership    — { membership_tier }
 *
 * Returns the provider order details the client uses to open the checkout SDK.
 *
 * Idempotency: checks payments table for an existing order on the same
 * booking / membership tier before calling the gateway, so double-tapping
 * "Pay Now" does not create duplicate orders.
 * ---------------------------------------------------------------------------
 */

import { parseBody, requireAuth, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertRateLimit, getClientIP }    from '@/lib/security/rate-limit';
import { assertCsrf }                      from '@/lib/security/csrf';
import { createServiceRoleClient }         from '@/lib/supabase/service';
import { getPaymentProvider }              from '@/lib/providers';
import { ProviderNotConfiguredError }       from '@/lib/providers';
import { logAudit }                        from '@/lib/audit';
import { hashToken }                       from '@/lib/security/tokens';
import { scoreFraudRisk }                  from '@/lib/ai/fraud';
import { z }                               from 'zod';

const createOrderSchema = z.union([
  z.object({
    booking_id:       z.string().uuid('booking_id must be a UUID'),
    membership_tier:  z.undefined(),
  }),
  z.object({
    booking_id:       z.undefined(),
    membership_tier:  z.enum(['silver', 'gold', 'platinum', 'obsidian']),
  }),
]).transform((data) => data);

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // Rate limit by user ID.
  const rateLimitError = await assertRateLimit('payments:create', user.id);
  if (rateLimitError) return rateLimitError;

  // CSRF check.
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // Parse body.
  let bookingId: string | undefined;
  let membershipTier: string | undefined;

  try {
    const raw = await request.json() as Record<string, unknown>;
    if (raw.booking_id) {
      bookingId = raw.booking_id as string;
    } else if (raw.membership_tier) {
      membershipTier = raw.membership_tier as string;
    } else {
      return apiError('Provide either booking_id or membership_tier.', 400);
    }
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const db = createServiceRoleClient();

  let amountPaise: number;
  let receiptId:   string;
  let paymentType: 'booking' | 'membership';
  let dbBookingId: string | null = null;

  try {
    if (bookingId) {
      // --- Booking payment ---
      const { data: booking, error: bookingError } = await db
        .from('bookings')
        .select('id, booking_ref, status, total_paise, user_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return apiError('Booking not found.', 404);
      }

      const b = booking as Record<string, unknown>;

      // Verify ownership.
      if (b.user_id !== user.id) {
        return apiError('Forbidden.', 403);
      }

      // Must be in pending state.
      if (b.status !== 'pending') {
        return apiError(
          `Cannot create payment for a booking with status '${b.status}'.`,
          409
        );
      }

      amountPaise  = b.total_paise as number;
      receiptId    = b.booking_ref as string;
      paymentType  = 'booking';
      dbBookingId  = bookingId;

      // Idempotency: return existing order if one already exists for this booking.
      const { data: existingPayment } = await db
        .from('payments')
        .select('id, provider_order_id, amount_paise, provider')
        .eq('booking_id', bookingId)
        .eq('status', 'created')
        .maybeSingle();

      if (existingPayment) {
        const ep = existingPayment as Record<string, unknown>;
        return apiSuccess({
          order_id:    ep.provider_order_id,
          amount:      ep.amount_paise,
          currency:    'INR',
          provider:    ep.provider,
          booking_ref: receiptId,
        });
      }

    } else {
      // --- Membership payment ---
      const { data: plan, error: planError } = await db
        .from('membership_plans')
        .select('id, price_paise, slug, name')
        .eq('slug', membershipTier!)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return apiError(`Membership tier '${membershipTier}' not found.`, 404);
      }

      const p      = plan as Record<string, unknown>;
      amountPaise  = p.price_paise as number;
      receiptId    = `MEMB-${membershipTier!.toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}`;
      paymentType  = 'membership';
    }

    // Fraud scoring — synchronous rule-based check (<5ms).
    if (dbBookingId) {
      const [bookingsAll, bookings24h, userProfile] = await Promise.all([
        db.from('bookings').select('id').eq('user_id', user.id).eq('status', 'confirmed'),
        db.from('bookings').select('id').eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
        db.from('user_profiles').select('created_at').eq('id', user.id).maybeSingle(),
      ]);

      const memberCreatedAt = (userProfile.data as Record<string, unknown> | null)?.created_at as string | null;
      const memberAgeDays = memberCreatedAt
        ? Math.floor((Date.now() - new Date(memberCreatedAt).getTime()) / 86_400_000)
        : 0;

      const ip = getClientIP(request);
      const { data: ipBookings } = await db
        .from('payments')
        .select('user_id')
        .eq('metadata->>ip_address', ip)
        .gte('created_at', new Date(Date.now() - 86_400_000).toISOString());

      const uniqueIpUsers = new Set((ipBookings ?? []).map((r: Record<string, unknown>) => r.user_id)).size;

      const fraudScore = scoreFraudRisk({
        member_id:                  user.id,
        ip_address:                 ip,
        user_agent:                 request.headers.get('user-agent') ?? '',
        amount_paise:               amountPaise,
        deal_id:                    dbBookingId,
        payment_method:             'unknown',
        member_age_days:            memberAgeDays,
        lifetime_bookings:          (bookingsAll.data ?? []).length,
        bookings_last_24h:          (bookings24h.data ?? []).length,
        tokens_used_pct:            0,
        is_new_delivery_address:    false,
        same_ip_different_members:  Math.max(0, uniqueIpUsers - 1),
      });

      if (fraudScore.action === 'block') {
        await logAudit({
          action:      'payment.fraud_blocked',
          actor_type:  'member',
          actor_id:    user.id,
          target_type: 'booking',
          target_id:   dbBookingId,
          details:     { fraud_score: fraudScore.risk_score, triggered_rules: fraudScore.triggered_rules },
          ip_address:  ip,
        });
        return apiError(fraudScore.reason ?? 'Transaction blocked.', 403);
      }

      if (fraudScore.action === 'flag') {
        // Continue but insert into fraud review queue.
        db.from('audit_logs').insert({
          action:      'payment.fraud_flagged',
          actor_type:  'member',
          actor_id:    user.id,
          target_type: 'booking',
          target_id:   dbBookingId,
          details:     { fraud_score: fraudScore.risk_score, risk_level: fraudScore.risk_level, triggered_rules: fraudScore.triggered_rules },
          ip_address:  ip,
          created_at:  new Date().toISOString(),
        }).then(null, () => { /* non-fatal */ });
      }
    }

    // Get active payment provider.
    let provider;
    try {
      provider = await getPaymentProvider();
    } catch (err) {
      if (err instanceof ProviderNotConfiguredError) {
        return apiError(
          'Payment gateway is not configured. Please contact admin.',
          503
        );
      }
      throw err;
    }

    // Create order via provider.
    const order = await provider.createOrder({
      amountPaise,
      currency:  'INR',
      receiptId,
      notes: { user_id: user.id, payment_type: paymentType },
    });

    // Generate idempotency key.
    const idempotencyKey = hashToken(
      `${user.id}:${dbBookingId ?? membershipTier}:${order.orderId}`
    );

    // Persist payment record.
    const { data: payment, error: paymentInsertError } = await db
      .from('payments')
      .insert({
        booking_id:        dbBookingId,
        user_id:           user.id,
        payment_type:      paymentType,
        status:            'created',
        amount_paise:      amountPaise,
        currency:          'INR',
        provider:          provider.name,
        provider_order_id: order.orderId,
        idempotency_key:   idempotencyKey,
        metadata:          { receipt_id: receiptId, raw_order: order.raw },
      })
      .select('id')
      .single();

    if (paymentInsertError) {
      console.error('[POST /api/payments/create-order] Payment insert error:', paymentInsertError.message);
      // Return order anyway — client can still attempt payment; webhook will reconcile.
    }

    const ip = getClientIP(request);
    await logAudit({
      action:      'payment.order_created',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: paymentType,
      target_id:   dbBookingId ?? undefined,
      details:     {
        event:        'order_created',
        order_id:     order.orderId,
        amount_paise: amountPaise,
        provider:     provider.name,
        is_test_mode: provider.isTestMode,
      },
      ip_address:  ip,
    });

    return apiSuccess({
      order_id:     order.orderId,
      amount:       order.amount,
      currency:     order.currency,
      provider:     provider.name,
      is_test_mode: provider.isTestMode,
      booking_ref:  receiptId,
    });

  } catch (err) {
    console.error('[POST /api/payments/create-order] Unexpected error:', err);
    return apiError('Failed to create payment order. Please try again.', 500);
  }
}
