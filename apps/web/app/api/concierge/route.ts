/**
 * GET  /api/concierge — list the authenticated member's own concierge requests
 * POST /api/concierge — create a new concierge request (Platinum / Obsidian only)
 *
 * Concierge is a bespoke sourcing service available exclusively to Platinum and
 * Obsidian tier members. Silver and Gold members receive a 403 on both endpoints.
 *
 * POST flow:
 *   1. requireAuth
 *   2. Rate limit (api:general)
 *   3. CSRF validation
 *   4. Zod body validation
 *   5. Tier check — Platinum / Obsidian only
 *   6. Insert concierge_requests row
 *   7. Queue admin notification (email, high priority)
 *   8. Audit log
 *   9. Return request_ref + pending status
 *
 * TODO: AI — AI concierge first response (see docs/AI_ROADMAP.md)
 *       On insert, trigger lib/ai/concierge-assist.ts to draft an initial
 *       acknowledgement that surfaces relevant active deals matching the
 *       category / budget — email to member within 60 seconds.
 */

import { randomInt } from 'crypto';
import { requireAuth, apiSuccess, apiError, parseBody, getPagination } from '@/lib/api-helpers';
import { assertRateLimit, getClientIP }                                 from '@/lib/security/rate-limit';
import { assertCsrf }                                                   from '@/lib/security/csrf';
import { createServiceRoleClient }                                      from '@/lib/supabase/service';
import { createConciergeSchema }                                        from '@/lib/validations';
import { logAudit }                                                     from '@/lib/audit';

/** Tiers permitted to use the concierge service. */
const CONCIERGE_TIERS = new Set(['platinum', 'obsidian']);

// ---------------------------------------------------------------------------
// GET /api/concierge
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const db = createServiceRoleClient();

  // Verify the member holds a platinum/obsidian membership before querying.
  const { data: membership, error: membershipError } = await db
    .from('memberships')
    .select('id, status, membership_plans ( slug )')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) {
    console.error('[GET /api/concierge] membership query error:', membershipError.message);
    return apiError('Failed to verify membership.', 500);
  }

  const planSlug = resolvePlanSlug(membership?.membership_plans);

  if (!CONCIERGE_TIERS.has(planSlug)) {
    return apiError(
      'Concierge is available for Platinum and Obsidian members only.',
      403
    );
  }

  const { searchParams } = new URL(request.url);
  const { limit, offset, page } = getPagination(searchParams);

  try {
    const { data, error, count } = await db
      .from('concierge_requests')
      .select(
        `
          id,
          request_ref,
          category,
          brand_preference,
          budget_min_paise,
          budget_max_paise,
          timeline,
          notes,
          status,
          created_at,
          updated_at
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[GET /api/concierge] DB error:', error.message);
      return apiError('Failed to fetch concierge requests.', 500);
    }

    return apiSuccess({
      requests: (data ?? []).map(normaliseRequest),
      total:    count ?? 0,
      page,
      limit,
      pages:    Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error('[GET /api/concierge] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/concierge
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
  const parsed = await parseBody(request, createConciergeSchema);
  if ('error' in parsed) return parsed.error;
  const { category, brand_preference, budget_min_inr, budget_max_inr, timeline, notes } = parsed.data;

  const db = createServiceRoleClient();

  // Tier check — Platinum / Obsidian only.
  const { data: membership, error: membershipError } = await db
    .from('memberships')
    .select('id, status, membership_plans ( slug )')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) {
    console.error('[POST /api/concierge] membership query error:', membershipError.message);
    return apiError('Failed to verify membership.', 500);
  }

  if (!membership) {
    return apiError('You do not have an active membership.', 403);
  }

  const planSlug = resolvePlanSlug(membership.membership_plans);

  if (!CONCIERGE_TIERS.has(planSlug)) {
    return apiError(
      'Concierge is available for Platinum and Obsidian members only.',
      403
    );
  }

  // Generate human-readable request ref.
  const requestRef = generateConciergeRef();

  // Convert INR budgets to paise for storage.
  const budgetMinPaise = budget_min_inr != null ? Math.round(budget_min_inr * 100) : null;
  const budgetMaxPaise = budget_max_inr != null ? Math.round(budget_max_inr * 100) : null;

  try {
    // Insert concierge request.
    const { data: inserted, error: insertError } = await db
      .from('concierge_requests')
      .insert({
        user_id:          user.id,
        request_ref:      requestRef,
        category,
        brand_preference: brand_preference ?? null,
        budget_min_paise: budgetMinPaise,
        budget_max_paise: budgetMaxPaise,
        timeline,
        notes,
        status:           'pending',
      })
      .select('id, request_ref, status')
      .single();

    if (insertError || !inserted) {
      console.error('[POST /api/concierge] insert error:', insertError?.message);
      return apiError('Failed to submit concierge request. Please try again.', 500);
    }

    const insertedRow = inserted as Record<string, unknown>;

    // Queue admin notification.
    await db.from('notifications').insert({
      user_id:       null, // admin notification — no specific user target
      channel:       'email',
      template_name: 'CONCIERGE_NEW_REQUEST',
      template_data: {
        request_ref:      requestRef,
        member_id:        user.id,
        category,
        brand_preference: brand_preference ?? null,
        budget_min_inr:   budget_min_inr ?? null,
        budget_max_inr:   budget_max_inr ?? null,
        timeline,
        notes,
        plan_tier:        planSlug,
      },
      priority:      'high',
      status:        'queued',
    });

    // Audit log.
    const ip = getClientIP(request);
    await logAudit({
      action:      'concierge.request_created',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: 'concierge_request',
      target_id:   insertedRow.id as string,
      details:     { request_ref: requestRef, category, plan_tier: planSlug },
      ip_address:  ip,
      user_agent:  request.headers.get('user-agent') ?? undefined,
    });

    // Non-blocking: trigger AI assist after saving
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/concierge/ai-assist`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.INTERNAL_JOB_TOKEN ?? ''}`,
        'content-type':  'application/json',
      },
      body: JSON.stringify({ request_id: insertedRow.id }),
    }).catch(() => undefined); // intentionally non-blocking

    return apiSuccess(
      {
        request_ref: requestRef,
        status:      'pending',
        message:     'Your concierge request has been received. We will reach out within 24 hours.',
      },
      201
    );
  } catch (err) {
    console.error('[POST /api/concierge] Unexpected error:', err);
    return apiError('Internal server error.', 500);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the plan slug from a Supabase joined membership_plans value. */
function resolvePlanSlug(raw: unknown): string {
  if (!raw) return 'silver';
  const arr = Array.isArray(raw) ? raw : [raw];
  const plan = arr[0] as Record<string, unknown> | null;
  return (plan?.slug as string) ?? 'silver';
}

/** Generate a human-readable concierge request reference: CRQ-XXXXXX. */
function generateConciergeRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'CRQ-';
  for (let i = 0; i < 6; i++) {
    ref += chars[randomInt(chars.length)];
  }
  return ref;
}

/** Normalise a raw concierge_requests row for the API response. */
function normaliseRequest(row: Record<string, unknown>) {
  return {
    id:               row.id,
    request_ref:      row.request_ref,
    category:         row.category,
    brand_preference: row.brand_preference,
    budget_min_inr:   row.budget_min_paise != null ? (row.budget_min_paise as number) / 100 : null,
    budget_max_inr:   row.budget_max_paise != null ? (row.budget_max_paise as number) / 100 : null,
    timeline:         row.timeline,
    notes:            row.notes,
    status:           row.status,
    created_at:       row.created_at,
    updated_at:       row.updated_at,
  };
}
