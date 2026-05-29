/**
 * app/api/admin/support/[id]/reply/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/admin/support/[id]/reply — admin replies to a support ticket
 * ---------------------------------------------------------------------------
 */

import { z }                                              from 'zod';
import { apiSuccess, apiError, requireAdmin, buildAuditEntry } from '@/lib/api-helpers';
import { createServiceRoleClient }                        from '@/lib/supabase/service';
import { assertCsrf }                                     from '@/lib/security/csrf';

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const replySchema = z.object({
  message: z.string().min(1, 'Message is required.').max(5000),
  status:  z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/support/[id]/reply
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;
  const { session } = auth;

  const csrfError = assertCsrf(request, session.id);
  if (csrfError) return csrfError;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? 'Validation failed.', 400, parsed.error.issues);
  }

  const { message, status } = parsed.data;

  try {
    const db  = createServiceRoleClient();
    const now = new Date().toISOString();

    // Verify ticket exists
    const { data: ticket, error: fetchError } = await db
      .from('support_tickets')
      .select('id, ticket_ref, user_id, messages, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !ticket) {
      return apiError('Support ticket not found.', 404);
    }

    // Append admin message to messages JSONB array
    const existingMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const newMessage = { role: 'admin', text: message, created_at: now };
    const updatedMessages = [...existingMessages, newMessage];

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      messages:   updatedMessages,
      updated_at: now,
    };
    if (status) {
      updatePayload.status = status;
    }

    const { error: updateError } = await db
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      console.error('[admin/support/[id]/reply] update error:', updateError.message);
      return apiError('Failed to update support ticket.', 500);
    }

    // Queue notification to member (email)
    const ticketRef = ticket.ticket_ref as string;
    await db.from('notifications').insert({
      user_id:       ticket.user_id,
      channel:       'email',
      template_name: 'SUPPORT_REPLY',
      template_data: { ticket_ref: ticketRef, message },
      priority:      'medium',
      status:        'queued',
      scheduled_for: now,
    });

    // Audit log
    await db.from('audit_logs').insert(
      buildAuditEntry({
        action:     'support.admin_reply',
        actorType:  'admin',
        actorId:    session.adminUserId,
        targetType: 'support_tickets',
        targetId:   id,
        details:    { ticket_id: id, status_changed_to: status ?? null },
        request,
      })
    );

    return apiSuccess({ updated: true });
  } catch (err) {
    console.error('[admin/support/[id]/reply] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
