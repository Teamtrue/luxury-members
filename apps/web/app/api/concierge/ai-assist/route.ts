/**
 * POST /api/concierge/ai-assist
 * ---------------------------------------------------------------------------
 * Internal service endpoint — triggered by POST /api/concierge after a
 * concierge request is saved. Generates an AI-drafted first-response using
 * the Anthropic API (claude-haiku-4-5) and stores it back on the
 * concierge_requests row.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN (same pattern as notification dispatch).
 *
 * Body: { request_id: string }
 *
 * Returns: { request_id, draft, confidence }
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Bearer token guard (mirrors app/api/internal/notifications/dispatch/route.ts)
// ---------------------------------------------------------------------------

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[concierge/ai-assist] INTERNAL_JOB_TOKEN not set — skipping auth in dev mode.');
      return null;
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Internal job token not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${expected}`) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// POST /api/concierge/ai-assist
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // Auth guard
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  // Parse body
  let body: { request_id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON in request body.', 400);
  }

  const requestId = body.request_id;
  if (!requestId || typeof requestId !== 'string') {
    return apiError('request_id is required.', 400);
  }

  const db = createServiceRoleClient();

  // -------------------------------------------------------------------------
  // 1. Fetch the concierge_request row
  // -------------------------------------------------------------------------
  const { data: conciergeRequest, error: requestError } = await db
    .from('concierge_requests')
    .select(
      'id, user_id, request_ref, category, brand_preference, budget_min_paise, budget_max_paise, timeline, notes, status'
    )
    .eq('id', requestId)
    .maybeSingle();

  if (requestError) {
    console.error('[concierge/ai-assist] DB error fetching request:', requestError.message);
    return apiError('Failed to fetch concierge request.', 500);
  }

  if (!conciergeRequest) {
    return apiError('Concierge request not found.', 404);
  }

  const userId = conciergeRequest.user_id as string;

  // -------------------------------------------------------------------------
  // 2. Fetch member's user profile (name + tier via membership)
  // -------------------------------------------------------------------------
  const [profileResult, membershipResult] = await Promise.all([
    db
      .from('user_profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .maybeSingle(),
    db
      .from('memberships')
      .select('id, membership_plans ( slug )')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const memberName = (profileResult.data?.full_name as string | null) ?? 'Valued Member';
  const memberTier = resolvePlanSlug(membershipResult.data?.membership_plans);

  // -------------------------------------------------------------------------
  // 3. Fetch last 10 bookings for booking history summary
  // -------------------------------------------------------------------------
  const { data: recentBookings } = await db
    .from('bookings')
    .select('deals ( title, category ), amount_paid_paise, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const bookingSummary = buildBookingSummary(recentBookings ?? []);

  // -------------------------------------------------------------------------
  // 4. Build budget strings (convert paise → INR)
  // -------------------------------------------------------------------------
  const budgetMin = conciergeRequest.budget_min_paise != null
    ? conciergeRequest.budget_min_paise / 100
    : null;
  const budgetMax = conciergeRequest.budget_max_paise != null
    ? conciergeRequest.budget_max_paise / 100
    : null;

  const request_data = {
    category:        conciergeRequest.category as string,
    brand_preference: conciergeRequest.brand_preference as string | null,
    budget_min:      budgetMin,
    budget_max:      budgetMax,
    timeline:        conciergeRequest.timeline as string | null,
    notes:           conciergeRequest.notes as string,
  };

  // -------------------------------------------------------------------------
  // 5. If ANTHROPIC_API_KEY is not set, store a placeholder draft and return
  // -------------------------------------------------------------------------
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await storeDraft(db, requestId, 'AI assist not configured. Manual review required.');
    return apiSuccess({
      request_id: requestId,
      draft:      'AI assist not configured. Manual review required.',
      confidence: 0,
    });
  }

  // -------------------------------------------------------------------------
  // 6. Call Anthropic API (claude-haiku-4-5-20251001)
  // -------------------------------------------------------------------------
  let draft = '';

  try {
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [
          {
            role:    'user',
            content: `You are a luxury concierge assistant. A premium member has submitted a request. Write a warm, personalized acknowledgement and 2-3 preliminary suggestions.

Member: ${memberName} (${memberTier} tier)
Request category: ${request_data.category}
Budget: ${request_data.budget_min ? `₹${request_data.budget_min}` : 'Not specified'} - ${request_data.budget_max ? `₹${request_data.budget_max}` : 'Not specified'}
Timeline: ${request_data.timeline ?? 'Flexible'}
Notes: ${request_data.notes}

Previous bookings summary: ${bookingSummary}

Write a 3-4 sentence response that: acknowledges the request, mentions 1-2 specific suggestions based on their preferences, and sets expectation for follow-up within 24 hours. Do not make up specific products or prices.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[concierge/ai-assist] Anthropic API error:', aiResponse.status, errText);
      // Fall through with empty draft — store placeholder
    } else {
      const aiData = await aiResponse.json() as {
        content?: Array<{ type: string; text?: string }>;
      };
      draft = aiData.content?.[0]?.text ?? '';
    }
  } catch (fetchErr) {
    console.error('[concierge/ai-assist] fetch error calling Anthropic:', fetchErr);
    // Fall through with empty draft
  }

  // If draft is empty (API call failed), store a graceful placeholder
  if (!draft) {
    draft = 'AI draft generation failed. Manual review required.';
  }

  // -------------------------------------------------------------------------
  // 7. Store draft in concierge_requests table
  // -------------------------------------------------------------------------
  await storeDraft(db, requestId, draft);

  const confidence = draft.length > 50 ? 0.8 : 0.3;

  return apiSuccess({ request_id: requestId, draft, confidence });
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

/** Build a concise text summary of recent booking history. */
function buildBookingSummary(bookings: unknown[]): string {
  if (!bookings.length) return 'No previous bookings.';

  type BookingRow = Record<string, unknown>;

  const lines = (bookings as BookingRow[]).slice(0, 10).map((b) => {
    const deal = resolveDealInfo(b.deals);
    const amountPaise = (b.amount_paid_paise as number | null) ?? 0;
    const amountInr = Math.round(amountPaise / 100);
    if (deal) {
      return `${deal.title} (${deal.category}) — ₹${amountInr}`;
    }
    return `Booking — ₹${amountInr}`;
  });

  return lines.join('; ');
}

/** Resolve deal info from a Supabase joined deals value. */
function resolveDealInfo(raw: unknown): { title: string; category: string } | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const deal = arr[0] as Record<string, unknown> | null;
  if (!deal) return null;
  return {
    title:    (deal.title as string) ?? 'Unknown',
    category: (deal.category as string) ?? 'Unknown',
  };
}

/** Upsert the AI draft onto the concierge_requests row. */
async function storeDraft(
  db: ReturnType<typeof createServiceRoleClient>,
  requestId: string,
  draft: string
): Promise<void> {
  const { error } = await db
    .from('concierge_requests')
    .update({
      ai_draft_response: draft,
      ai_processed_at:   new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('[concierge/ai-assist] Failed to store AI draft:', error.message);
  }
}
