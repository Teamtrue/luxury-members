/**
 * GET /api/support/[id] — retrieve a single support ticket by ID
 *
 * Only the ticket owner may access their own ticket.
 * Returns 404 if not found or the ticket belongs to a different user.
 */

import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';
import { createServiceRoleClient }           from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// GET /api/support/[id]
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

  const { data: ticket, error } = await db
    .from('support_tickets')
    .select(
      `
        id,
        user_id,
        ticket_ref,
        subject,
        category,
        status,
        priority,
        messages,
        resolved_at,
        created_at,
        updated_at
      `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[GET /api/support/[id]] DB error:', error.message);
    return apiError('Failed to fetch support ticket.', 500);
  }

  if (!ticket) {
    return apiError('Support ticket not found.', 404);
  }

  const ticketRow = ticket as Record<string, unknown>;

  return apiSuccess({
    ticket: {
      id:          ticketRow.id,
      ticket_ref:  ticketRow.ticket_ref,
      subject:     ticketRow.subject,
      category:    ticketRow.category,
      status:      ticketRow.status,
      priority:    ticketRow.priority,
      messages:    ticketRow.messages,
      resolved_at: ticketRow.resolved_at ?? null,
      created_at:  ticketRow.created_at,
      updated_at:  ticketRow.updated_at,
    },
  });
}
