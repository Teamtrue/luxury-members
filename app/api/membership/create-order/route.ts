/**
 * POST /api/membership/create-order
 * ---------------------------------------------------------------------------
 * Creates a payment provider order for a membership purchase.
 * Requires the caller to be authenticated (their own membership) or an admin.
 * ---------------------------------------------------------------------------
 */

import { z }                       from 'zod';
import { parseBody, requireAuth, apiSuccess, apiError } from '@/lib/api-helpers';
import { assertCsrf }              from '@/lib/security/csrf';
import { assertRateLimit, getClientIP } from '@/lib/security/rate-limit';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getPaymentProvider }      from '@/lib/providers';
import { ProviderNotConfiguredError } from '@/lib/providers';
import { logAudit }                from '@/lib/audit';

const createMembershipOrderSchema = z.object({
  tier: z.enum(['silver', 'gold', 'platinum', 'obsidian']).refine(
    (v) => ['silver', 'gold', 'platinum', 'obsidian'].includes(v),
    { message: 'tier must be silver, gold, platinum, or obsidian.' }
  ),
});

export async function POST(request: Request): Promise<Response> {
  // 1. Auth — caller must be a signed-in member
  const auth = await requireAuth(request);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // 2. CSRF
  const csrfError = assertCsrf(request, user.id);
  if (csrfError) return csrfError;

  // 3. Rate limit — prevent order creation spam
  const ip = getClientIP(request);
  const rateLimitError = await assertRateLimit('api:create-order', ip);
  if (rateLimitError) return rateLimitError;

  // 4. Parse + validate body
  const parsed = await parseBody(request, createMembershipOrderSchema);
  if ('error' in parsed) return parsed.error;
  const { tier } = parsed.data;

  const db = createServiceRoleClient();

  try {
    // 5. Look up the plan to get the authoritative price from the DB
    const { data: plan, error: planError } = await db
      .from('membership_plans')
      .select('id, name, price_paise, slug')
      .eq('slug', tier)
      .maybeSingle();

    if (planError || !plan) {
      return apiError(`Membership plan '${tier}' not found.`, 404);
    }

    const p = plan as Record<string, unknown>;
    const amountPaise = p.price_paise as number;
    const receiptId   = `MEMB-${user.id.slice(0, 8)}-${Date.now()}`;

    // 6. Create provider order
    let provider;
    try {
      provider = await getPaymentProvider();
    } catch (err) {
      if (err instanceof ProviderNotConfiguredError) {
        return apiError('Payment gateway is not configured. Please contact support.', 503);
      }
      throw err;
    }

    const order = await provider.createOrder({
      amountPaise,
      currency:  'INR',
      receiptId,
      notes:     { user_id: user.id, payment_type: 'membership', tier },
    });

    // 7. Insert a pending membership row so verify/webhook can activate it
    const { error: membershipError } = await db
      .from('memberships')
      .upsert(
        {
          user_id:    user.id,
          plan_id:    p.id as string,
          status:     'pending',
          started_at: null,
          expires_at: null,
        },
        { onConflict: 'user_id', ignoreDuplicates: false }
      );

    if (membershipError) {
      console.error('[membership/create-order] membership upsert error:', membershipError.message);
      // Non-fatal: webhook will create it if missing
    }

    // 8. Audit
    await logAudit({
      action:      'payment.membership_order_created',
      actor_type:  'member',
      actor_id:    user.id,
      target_type: 'membership',
      details:     { tier, amount_paise: amountPaise, order_id: order.orderId, provider: provider.name },
      ip_address:  ip,
    });

    return apiSuccess({
      order_id:      order.orderId,
      amount_paise:  amountPaise,
      currency:      order.currency,
      tier,
      provider_name: provider.name,
      is_test_mode:  provider.isTestMode,
      raw:           order.raw,
    });
  } catch (err) {
    console.error('[membership/create-order] unexpected error:', err);
    return apiError('Failed to create membership order. Please try again.', 500);
  }
}
