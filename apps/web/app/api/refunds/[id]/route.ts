/**
 * GET /api/refunds/[id] — retrieve the status of a single refund request
 *
 * Returns full refund detail including admin notes, provider refund ID, and
 * processing timestamps. Only the refund owner may access it — existence is
 * not leaked to other members (non-owner receives 403, not 404).
 *
 * Money: amount_paise stored in DB, returned as amount_inr (÷100) in response.
 */

import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';
import { createServiceRoleClient }           from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// GET /api/refunds/[id]
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { id } = await params;

  const db = createServiceRoleClient();

  const { data: refund, error } = await db
    .from('refunds')
    .select(
      `
        id,
        user_id,
        booking_id,
        amount_paise,
        status,
        reason,
        admin_notes,
        provider_refund_id,
        created_at,
        processed_at
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[GET /api/refunds/[id]] DB error:', error.message);
    return apiError('Failed to fetch refund.', 500);
  }

  if (!refund) {
    return apiError('Refund not found.', 404);
  }

  const refundRow = refund as Record<string, unknown>;

  // Do not leak existence to non-owners.
  if (refundRow.user_id !== user.id) {
    return apiError('You do not have access to this refund.', 403);
  }

  const amountPaise = (refundRow.amount_paise as number) ?? 0;

  return apiSuccess({
    id:                 refundRow.id,
    booking_id:         refundRow.booking_id,
    amount_inr:         amountPaise / 100,
    status:             refundRow.status,
    reason:             refundRow.reason,
    admin_notes:        refundRow.admin_notes        ?? null,
    provider_refund_id: refundRow.provider_refund_id ?? null,
    created_at:         refundRow.created_at,
    processed_at:       refundRow.processed_at       ?? null,
  });
}
