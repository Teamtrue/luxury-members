/**
 * GET  /api/refunds — list the authenticated member's own refund requests (paginated)
 * POST /api/refunds — request a refund for a confirmed booking
 *
 * POST flow:
 *   1. requireAuth
 *   2. CSRF validation
 *   3. Zod body validation (createRefundSchema)
 *   4. Load + ownership-check booking (must be 'confirmed')
 *   5. Guard against duplicate non-rejected refund on the same booking
 *   6. Load associated payment record to determine refund amount
 *   7. Insert refunds row (amount_paise from payment, or 0 if no payment found)
 *   8. Queue admin notification (email, high priority)
 *   9. Audit log
 *  10. Return 201 with refund_id, amount_inr, and user-friendly message
 */

import { requireAuth, apiSuccess, apiError, parseBody, getPagination } from '@/lib/api-helpers';
import { assertCsrf }                                                   from '@/lib/security/csrf';
import { createServiceRoleClient }                                      from '@/lib/supabase/service';
import { createRefundSchema }                                           from '@/lib/validations';
import { logAudit }                                                     from '@/lib/audit';

// ---------------------------------------------------------------------------
// GET /api/refunds
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const { limit, offset, page } = getPagination(searchParams);

  const db = createServiceRoleClient();

  try {
    const { data, error, count } = await db
      .from('refunds')
      .select(
        `
          id,
          booking_id,
          amount_paise,
          status,
          reason,
          created_at,
          bookings ( booking_ref, deal_id )
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[GET /api/refunds] DB error:', error.message);
      return apiError('Failed to fetch refunds.', 500);
    }

    const rows = (data ?? []).map((row: Record<string, unknown>) => {
      const booking = resolveJoin(row.bookings) as Record<string, unknown> | null;
      const amountPaise = (row.amount_paise as number) ?? 0;
      return {
        id:          row.id,
        booking_id:  row.booking_id,
        booking_ref: booking?.booking_ref ?? null,
        deal_id:     booking?.deal_id     ?? null,
        amount_inr:  amountPaise / 100,
        status:      row.status,
        reason:      row.reason,
        created_at:  row.created_at,
      };
    });

    return apiSuccess({
      refunds: rows,
      total:   count ?? 0,
      page,
      limit,
      pages:   Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error('[GET /api/refunds] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/refunds
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // CSRF validation.
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // Body validation.
  const parsed = await parseBody(request, createRefundSchema);
  if ('error' in parsed) return parsed.error;
  const { booking_id, reason } = parsed.data;

  const db = createServiceRoleClient();

  // Load booking — must belong to this member.
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select('id, booking_ref, status, user_id')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError) {
    console.error('[POST /api/refunds] booking query error:', bookingError.message);
    return apiError('Failed to load booking.', 500);
  }
  if (!booking) {
    return apiError('Booking not found.', 404);
  }

  const bookingRow = booking as Record<string, unknown>;

  // Only confirmed bookings can be refunded.
  if (bookingRow.status !== 'confirmed') {
    return apiError('Can only request refunds for confirmed bookings.', 400);
  }

  // Guard against duplicate non-rejected refunds.
  const { data: existing, error: existingError } = await db
    .from('refunds')
    .select('id')
    .eq('booking_id', booking_id)
    .neq('status', 'rejected')
    .maybeSingle();

  if (existingError) {
    console.error('[POST /api/refunds] duplicate check error:', existingError.message);
    return apiError('Failed to check existing refunds.', 500);
  }
  if (existing) {
    return apiError('A refund request already exists for this booking.', 409);
  }

  // Load the most recent payment to determine the refundable amount.
  const { data: payment } = await db
    .from('payments')
    .select('id, amount_paise')
    .eq('booking_id', booking_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentRow = payment as Record<string, unknown> | null;
  const amountPaise: number = (paymentRow?.amount_paise as number) ?? 0;

  try {
    // Insert refund request.
    const { data: inserted, error: insertError } = await db
      .from('refunds')
      .insert({
        user_id:      user.id,
        booking_id,
        payment_id:   paymentRow?.id ?? null,
        status:       'requested',
        amount_paise: amountPaise,
        reason,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[POST /api/refunds] insert error:', insertError?.message);
      return apiError('Failed to submit refund request. Please try again.', 500);
    }

    const insertedRow = inserted as Record<string, unknown>;

    // Audit log.
    await logAudit({
      action:      'refund.requested',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: 'refund',
      target_id:   insertedRow.id as string,
      details:     { booking_id, reason, amount_paise: amountPaise },
    });

    // Queue admin notification.
    await db.from('notifications').insert({
      user_id:       null, // admin notification
      channel:       'email',
      template_name: 'REFUND_REQUESTED',
      template_data: {
        refund_id:  insertedRow.id,
        booking_id,
        amount_inr: amountPaise / 100,
        reason,
        member_id:  user.id,
      },
      priority: 'high',
      status:   'queued',
    });

    return apiSuccess(
      {
        refund_id:  insertedRow.id,
        status:     'requested',
        amount_inr: amountPaise / 100,
        message:    'Refund request submitted. Processing takes 5-7 business days.',
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/refunds] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a Supabase joined relation that may be an array or a single object. */
function resolveJoin(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  return (arr[0] as Record<string, unknown>) ?? null;
}
