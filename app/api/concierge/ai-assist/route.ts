/**
 * POST /api/concierge/ai-assist
 * ---------------------------------------------------------------------------
 * Internal endpoint — called by POST /api/concierge after saving a request.
 * Generates an AI draft response for the human concierge team to review.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN only (no member session required).
 *
 * If OPENAI_API_KEY is set, calls GPT-4o and stores the draft.
 * If not set, generates a helpful template and stores that instead.
 * Never surfaces AI drafts directly to members — human review required.
 * ---------------------------------------------------------------------------
 */

import { z }                        from 'zod';
import { apiSuccess, apiError }     from '@/lib/api-helpers';
import { createServiceRoleClient }  from '@/lib/supabase/service';
import { logAudit }                 from '@/lib/audit';

const bodySchema = z.object({
  request_id: z.string().min(1),
  member_id:  z.string().min(1),
  category:   z.string(),
  brand:      z.string(),
  budget:     z.string(),
  timeline:   z.string(),
  notes:      z.string().optional().default(''),
});

export async function POST(request: Request): Promise<Response> {
  // Verify internal token.
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const expectedToken = process.env.INTERNAL_JOB_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return apiError('Unauthorized.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON.', 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid request body.', 400);

  const { request_id, member_id, category, brand, budget, timeline, notes } = parsed.data;

  const db = createServiceRoleClient();

  // Fetch member info for personalisation.
  const { data: profile } = await db
    .from('user_profiles')
    .select('full_name')
    .eq('id', member_id)
    .maybeSingle();

  const memberName = (profile as Record<string, unknown> | null)?.full_name as string ?? 'Valued Member';

  // Fetch recent booking history for context.
  const { data: recentBookings } = await db
    .from('bookings')
    .select('deals ( category, title )')
    .eq('user_id', member_id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(5);

  const bookingSummary = recentBookings && recentBookings.length > 0
    ? recentBookings
        .map((b: unknown) => {
          const deal = (b as Record<string, unknown>).deals as Record<string, unknown> | null;
          return deal?.category ?? 'general';
        })
        .join(', ')
    : 'no previous bookings';

  let draftResponse: string;
  let modelUsed = 'template';
  let tokensUsed = 0;

  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const prompt = `You are a personal concierge assistant for PlutusClub, India's private luxury buying club.
Draft a warm, professional response to a concierge request. This will be reviewed by the human concierge team before sending.

Member: ${memberName}
Category: ${category}
Product/Brand: ${brand}
Budget: ${budget}
Timeline: ${timeline}
Notes: ${notes || 'None'}
Member's booking history: ${bookingSummary}

Write a 3-4 sentence acknowledgement that:
1. Confirms you received the request
2. Mentions 1-2 specific angles you'll explore (sources, dealerships, or vendors relevant to ${category})
3. Sets the expectation for next contact within 24 hours
4. Uses a warm but professional luxury tone

Do not make specific price promises. Keep it under 150 words.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage: { total_tokens: number };
        };
        draftResponse = data.choices[0]?.message?.content ?? '';
        tokensUsed = data.usage?.total_tokens ?? 0;
        modelUsed = 'gpt-4o';
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    } catch (err) {
      console.warn('[concierge/ai-assist] OpenAI call failed, using template:', err);
      draftResponse = buildTemplateDraft(memberName, category, brand, timeline);
    }
  } else {
    draftResponse = buildTemplateDraft(memberName, category, brand, timeline);
  }

  // Store draft in concierge_requests.
  await db
    .from('concierge_requests')
    .update({ notes: `${notes}\n\n[AI DRAFT - FOR REVIEW ONLY]\n${draftResponse}` })
    .eq('id', request_id);

  await logAudit({
    action:      'concierge.ai_assist_generated',
    actor_type:  'system',
    target_type: 'concierge_request',
    target_id:   request_id,
    details:     { model: modelUsed, tokens_used: tokensUsed },
  });

  return apiSuccess({ request_id, draft_response: draftResponse, model: modelUsed, tokens_used: tokensUsed });
}

function buildTemplateDraft(
  memberName: string,
  category: string,
  brand: string,
  timeline: string
): string {
  return `Dear ${memberName}, thank you for your concierge request for ${brand} in the ${category} category. ` +
    `We've assigned your request to our specialist team who will reach out to our exclusive network of ` +
    `${category.toLowerCase()} partners to secure the best club pricing available. ` +
    `Given your timeline of "${timeline}", we'll contact you within 24 hours with options and pricing details. ` +
    `Your PlutusClub concierge team is looking forward to delivering an exceptional outcome.`;
}
