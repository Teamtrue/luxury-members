/**
 * app/api/internal/reconcile/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/internal/reconcile
 *
 * Cron job: reconcile captured payments that don't yet have a corresponding
 * payment_reconciliation row. Processes up to 100 unreconciled payments per run.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN header required.
 * ---------------------------------------------------------------------------
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';

// ---------------------------------------------------------------------------
// Bearer token guard — same pattern as /api/internal/notifications/dispatch
// ---------------------------------------------------------------------------

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[internal/reconcile] INTERNAL_JOB_TOKEN not set — skipping auth in dev mode.');
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
// POST /api/internal/reconcile
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db  = createServiceRoleClient();
  const now = new Date().toISOString();

  try {
    // -----------------------------------------------------------------------
    // Find captured payments that have no payment_reconciliation row yet.
    // We fetch the full payments rows we need (limit 100) then insert records.
    // -----------------------------------------------------------------------
    const { data: payments, error: fetchError } = await db
      .from('payments')
      .select('id, amount_paise, currency')
      .eq('status', 'captured')
      .not('id', 'in', `(SELECT payment_id FROM payment_reconciliation)`)
      .limit(100);

    if (fetchError) {
      console.error('[internal/reconcile] fetch error:', fetchError.message);
      return apiError('Failed to fetch unreconciled payments.', 500);
    }

    const unreconciled = payments ?? [];

    if (unreconciled.length === 0) {
      return apiSuccess({ reconciled: 0, ran_at: now });
    }

    // -----------------------------------------------------------------------
    // Insert reconciliation rows for each unreconciled payment.
    // The existing payment_reconciliation table uses provider_amount_paise and
    // recorded_amount_paise; for auto-reconciliation both are set to the
    // payment's amount (discrepancy = 0, status = 'matched').
    // -----------------------------------------------------------------------
    const rows = unreconciled.map((p) => ({
      payment_id:             p.id as string,
      status:                 'matched' as const,
      provider_amount_paise:  p.amount_paise as number,
      recorded_amount_paise:  p.amount_paise as number,
      discrepancy_paise:      0,
      notes:                  'Auto-reconciled by cron job.',
    }));

    const { error: insertError } = await db
      .from('payment_reconciliation')
      .insert(rows);

    if (insertError) {
      console.error('[internal/reconcile] insert error:', insertError.message);
      return apiError('Failed to insert reconciliation records.', 500);
    }

    console.log(`[internal/reconcile] reconciled ${rows.length} payment(s) at ${now}`);

    return apiSuccess({ reconciled: rows.length, ran_at: now });
  } catch (err) {
    console.error('[internal/reconcile] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
