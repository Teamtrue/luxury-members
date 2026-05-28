/**
 * GET  /api/concierge — list authenticated member's past concierge requests
 * POST /api/concierge — submit a new concierge request (Platinum+ only)
 */

import { z }                           from 'zod';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { assertCsrf }                  from '@/lib/security/csrf';
import { assertRateLimit }             from '@/lib/security/rate-limit';
import { createServiceRoleClient }     from '@/lib/supabase/service';
import { logAudit }                    from '@/lib/audit';

const ALLOWED_TIERS = new Set(['platinum', 'obsidian']);

const createConciergeSchema = z.object({
  category: z.string().min(1).max(100),
  brand:    z.string().min(1).max(200),
  budget:   z.string().min(1).max(100),
  timeline: z.string().min(1).max(100),
  notes:    z.string().max(1000).optional().default(''),
});

// ---------------------------------------------------------------------------
// GET /api/concierge
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const db = createServiceRoleClient();

  try {
    const { data, error } = await db
      .from('concierge_requests')
      .select('id, category, brand, budget_min, budget_max, timeline, notes, status, assigned_to, created_at')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[GET /api/concierge] DB error:', error.message);
      return apiError('Failed to fetch concierge requests.', 500);
    }

    return apiSuccess({ requests: data ?? [] });
  } catch (err) {
    console.error('[GET /api/concierge] Unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/concierge
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // CSRF check.
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // Rate limit: concierge uses the bookings bucket (10/hour).
  const rateLimitError = await assertRateLimit('bookings:create', user.id);
  if (rateLimitError) return rateLimitError;

  const db = createServiceRoleClient();

  // Verify Platinum+ tier.
  const { data: membership } = await db
    .from('memberships')
    .select('membership_plans ( slug )')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membership) {
    const plan = (membership as Record<string, unknown>).membership_plans as Record<string, unknown> | null;
    const tierSlug = (Array.isArray(plan) ? plan[0]?.slug : plan?.slug) as string ?? 'silver';
    if (!ALLOWED_TIERS.has(tierSlug)) {
      return apiError('Personal Concierge is available for Platinum and Obsidian members only.', 403);
    }
  }
  // If no active membership found, fall through — RLS on concierge_requests will catch it.

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const parsed = createConciergeSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError(first?.message ?? 'Validation failed.', 400, parsed.error.issues);
  }

  const { category, brand, budget, timeline, notes } = parsed.data;

  // Parse budget string into min/max paise (best-effort; store as text too).
  const budgetNum = parseInt(budget.replace(/[^0-9]/g, ''), 10) || null;

  const { data: newRequest, error: insertError } = await db
    .from('concierge_requests')
    .insert({
      member_id:  user.id,
      category,
      brand,
      budget_min: budgetNum,
      budget_max: budgetNum ? Math.round(budgetNum * 1.2) : null,
      timeline,
      notes,
      status: 'open',
    })
    .select('id, category, brand, status, created_at')
    .single();

  if (insertError || !newRequest) {
    console.error('[POST /api/concierge] Insert error:', insertError?.message);
    return apiError('Failed to submit concierge request. Please try again.', 500);
  }

  const req = newRequest as Record<string, unknown>;

  // Generate a human-readable request ID for display (CRQ-XXXX format).
  const displayId = 'CRQ-' + String(req.id as string).slice(0, 4).toUpperCase();

  await logAudit({
    action:      'concierge.request_created',
    actor_type:  'member',
    actor_id:    user.id,
    target_type: 'concierge_request',
    target_id:   req.id as string,
    details:     { category, brand, budget, timeline },
  });

  // Fire-and-forget AI assist draft (non-blocking).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const internalToken = process.env.INTERNAL_JOB_TOKEN;
  if (internalToken) {
    fetch(`${appUrl}/api/concierge/ai-assist`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${internalToken}`,
      },
      body: JSON.stringify({
        request_id: req.id,
        member_id:  user.id,
        category,
        brand,
        budget,
        timeline,
        notes,
      }),
    }).catch(err => console.warn('[concierge] AI assist call failed:', err));
  }

  return apiSuccess(
    { request_id: req.id, display_id: displayId, status: 'open' },
    201
  );
}
