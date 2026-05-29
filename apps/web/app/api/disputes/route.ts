/**
 * GET  /api/disputes — list the authenticated member's own disputes (paginated)
 * POST /api/disputes — raise a new dispute against a confirmed or delivered booking
 *
 * POST flow:
 *   1. requireAuth
 *   2. Rate limit (api:general)
 *   3. CSRF validation
 *   4. Zod body validation (createDisputeSchema)
 *   5. Load + ownership-check booking (must be 'confirmed' or 'delivered')
 *   6. Guard against duplicate open dispute on the same booking
 *   7. Load associated payment record (optional — stored as FK if present)
 *   8. Insert payment_disputes row
 *   9. Queue admin notification (email, high priority)
 *  10. Audit log
 *  11. Return 201 with dispute_id + user-friendly message
 */

import { requireAuth, apiSuccess, apiError, parseBody, getPagination } from '@/lib/api-helpers';
import { assertRateLimit }                                               from '@/lib/security/rate-limit';
import { assertCsrf }                                                   from '@/lib/security/csrf';
import { createServiceRoleClient }                                      from '@/lib/supabase/service';
import { createDisputeSchema }                                          from '@/lib/validations';
import { logAudit }                                                     from '@/lib/audit';

// ---------------------------------------------------------------------------
// GET /api/disputes
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
      .from('payment_disputes')
      .select(
        `
          id,
          booking_id,
          status,
          reason,
          description,
          created_at,
          updated_at,
          bookings ( booking_ref )
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[GET /api/disputes] DB error:', error.message);
      return apiError('Failed to fetch disputes.', 500);
    }

    const rows = (data ?? []).map((row: Record<string, unknown>) => {
      const booking = resolveJoin(row.bookings) as Record<string, unknown> | null;
      return {
        id:          row.id,
        booking_id:  row.booking_id,
        booking_ref: booking?.booking_ref ?? null,
        status:      row.status,
        reason:      row.reason,
        description: row.description,
        created_at:  row.created_at,
        updated_at:  row.updated_at,
      };
    });

    return apiSuccess({
      disputes: rows,
      total:    count ?? 0,
      page,
      limit,
      pages:    Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error('[GET /api/disputes] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/disputes
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // Rate limit by user ID.
  const rateLimitError = await assertRateLimit('api:general', user.id);
  if (rateLimitError) return rateLimitError;

  // CSRF validation.
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // Body validation.
  const parsed = await parseBody(request, createDisputeSchema);
  if ('error' in parsed) return parsed.error;
  const { booking_id, reason, description } = parsed.data;

  const db = createServiceRoleClient();

  // Load booking — must belong to this member.
  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select('id, booking_ref, status, user_id')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (bookingError) {
    console.error('[POST /api/disputes] booking query error:', bookingError.message);
    return apiError('Failed to load booking.', 500);
  }
  if (!booking) {
    return apiError('Booking not found.', 404);
  }

  // Only confirmed or delivered bookings can be disputed.
  const bookingRow = booking as Record<string, unknown>;
  if (!['confirmed', 'delivered'].includes(bookingRow.status as string)) {
    return apiError('Can only dispute confirmed or delivered bookings.', 400);
  }

  // Guard against duplicate open disputes.
  const { data: existing, error: existingError } = await db
    .from('payment_disputes')
    .select('id')
    .eq('booking_id', booking_id)
    .neq('status', 'rejected')
    .maybeSingle();

  if (existingError) {
    console.error('[POST /api/disputes] duplicate check error:', existingError.message);
    return apiError('Failed to check existing disputes.', 500);
  }
  if (existing) {
    return apiError('A dispute already exists for this booking.', 409);
  }

  // Load associated payment (optional).
  const { data: payment } = await db
    .from('payments')
    .select('id')
    .eq('booking_id', booking_id)
    .limit(1)
    .maybeSingle();

  const paymentRow = payment as Record<string, unknown> | null;

  try {
    // Insert dispute.
    const { data: inserted, error: insertError } = await db
      .from('payment_disputes')
      .insert({
        user_id:    user.id,
        booking_id,
        payment_id: paymentRow?.id ?? null,
        status:     'open',
        reason,
        description,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[POST /api/disputes] insert error:', insertError?.message);
      return apiError('Failed to raise dispute. Please try again.', 500);
    }

    const insertedRow = inserted as Record<string, unknown>;

    // Audit log.
    await logAudit({
      action:      'dispute.created',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: 'dispute',
      target_id:   insertedRow.id as string,
      details:     { booking_id, reason },
    });

    // Queue admin notification.
    await db.from('notifications').insert({
      user_id:       null, // admin notification
      channel:       'email',
      template_name: 'DISPUTE_NEW',
      template_data: {
        dispute_id: insertedRow.id,
        booking_id,
        reason,
        member_id:  user.id,
      },
      priority: 'high',
      status:   'queued',
    });

    return apiSuccess(
      {
        dispute_id: insertedRow.id,
        status:     'open',
        message:    'Your dispute has been raised. Our team will review within 3 business days.',
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/disputes] Unexpected error:', err);
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
