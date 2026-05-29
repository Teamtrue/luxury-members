/**
 * GET  /api/support — list the authenticated member's own support tickets
 * POST /api/support — create a new support ticket
 *
 * POST flow:
 *   1. requireAuth
 *   2. Inline Zod body validation
 *   3. Insert support_tickets row (status='open')
 *   4. Queue member notification (email, medium priority)
 *   5. Audit log
 *   6. Return 201 with ticket_id + status
 */

import { randomInt } from 'crypto';
import { z }                            from 'zod';
import { requireAuth, apiSuccess, apiError, parseBody } from '@/lib/api-helpers';
import { createServiceRoleClient }      from '@/lib/supabase/service';
import { logAudit }                     from '@/lib/audit';

// ---------------------------------------------------------------------------
// Validation schema (inline)
// ---------------------------------------------------------------------------

const createSupportTicketSchema = z.object({
  subject:     z.string().min(3, 'Subject must be at least 3 characters.').max(200, 'Subject too long.'),
  category:    z.enum(['billing', 'booking', 'membership', 'technical', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(5000, 'Description too long.'),
});

// ---------------------------------------------------------------------------
// GET /api/support
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const db = createServiceRoleClient();

  try {
    const { data, error } = await db
      .from('support_tickets')
      .select(
        `
          id,
          ticket_ref,
          subject,
          category,
          status,
          priority,
          created_at,
          updated_at
        `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[GET /api/support] DB error:', error.message);
      return apiError('Failed to fetch support tickets.', 500);
    }

    return apiSuccess({ tickets: data ?? [] });
  } catch (err) {
    console.error('[GET /api/support] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/support
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // Body validation.
  const parsed = await parseBody(request, createSupportTicketSchema);
  if ('error' in parsed) return parsed.error;
  const { subject, category, description } = parsed.data;

  const db = createServiceRoleClient();

  try {
    // Generate a unique ticket reference.
    const ticketRef = generateTicketRef();

    // Insert support ticket. The description is stored as the first message in the messages JSONB array.
    const { data: inserted, error: insertError } = await db
      .from('support_tickets')
      .insert({
        user_id:    user.id,
        ticket_ref: ticketRef,
        subject,
        category,
        status:     'open',
        priority:   'normal',
        messages:   [{ role: 'member', text: description, created_at: new Date().toISOString() }],
      })
      .select('id, ticket_ref, status')
      .single();

    if (insertError || !inserted) {
      console.error('[POST /api/support] insert error:', insertError?.message);
      return apiError('Failed to create support ticket. Please try again.', 500);
    }

    const insertedRow = inserted as Record<string, unknown>;

    // Queue member notification (email).
    await db.from('notifications').insert({
      user_id:       user.id,
      channel:       'email',
      template_name: 'SUPPORT_TICKET_CREATED',
      template_data: {
        ticket_id: insertedRow.id,
        subject,
      },
      priority: 'medium',
      status:   'queued',
    });

    // Audit log.
    await logAudit({
      action:      'support.ticket_created',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: 'support_ticket',
      target_id:   insertedRow.id as string,
      details:     { ticket_id: insertedRow.id, subject, category },
    });

    return apiSuccess(
      {
        ticket_id: insertedRow.id,
        ticket_ref: insertedRow.ticket_ref,
        status:    'open',
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/support] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTicketRef(): string {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let   result = 'ST-';
  for (let i = 0; i < 6; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}
