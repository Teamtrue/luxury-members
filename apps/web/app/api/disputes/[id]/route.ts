/**
 * GET /api/disputes/[id] — retrieve a single dispute by ID
 *
 * Returns the full detail of a dispute including admin notes and resolution.
 * Only the dispute owner may access it — existence is not leaked to other members
 * (i.e. a non-owner receives 403, not 404).
 */

import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';
import { createServiceRoleClient }           from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// GET /api/disputes/[id]
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

  const { data: dispute, error } = await db
    .from('payment_disputes')
    .select(
      `
        id,
        user_id,
        booking_id,
        status,
        reason,
        description,
        admin_notes,
        resolution,
        created_at,
        updated_at
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[GET /api/disputes/[id]] DB error:', error.message);
    return apiError('Failed to fetch dispute.', 500);
  }

  if (!dispute) {
    return apiError('Dispute not found.', 404);
  }

  const disputeRow = dispute as Record<string, unknown>;

  // Do not leak existence to non-owners — return 403 regardless.
  if (disputeRow.user_id !== user.id) {
    return apiError('You do not have access to this dispute.', 403);
  }

  return apiSuccess({
    id:          disputeRow.id,
    booking_id:  disputeRow.booking_id,
    status:      disputeRow.status,
    reason:      disputeRow.reason,
    description: disputeRow.description,
    admin_notes: disputeRow.admin_notes ?? null,
    resolution:  disputeRow.resolution  ?? null,
    created_at:  disputeRow.created_at,
    updated_at:  disputeRow.updated_at,
  });
}
