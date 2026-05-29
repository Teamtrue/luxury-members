/**
 * POST /api/internal/finance/close — Monthly finance close
 *
 * Generates a monthly close report: revenue, refunds, tokens issued/expired,
 * new members, and membership revenue. Runs as a cron on the 1st of each month.
 *
 * Auth: Bearer INTERNAL_JOB_TOKEN
 */

import { apiSuccess, apiError } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { logAudit } from '@/lib/audit';

function assertInternalAuth(request: Request): Response | null {
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV !== 'production') return null;
    return new Response(
      JSON.stringify({ success: false, error: 'Internal job token not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const authError = assertInternalAuth(request);
  if (authError) return authError;

  const db = createServiceRoleClient();
  const now = new Date();

  // Default to previous month
  let year  = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-indexed; 0 = January of current year
  if (month === 0) { year -= 1; month = 12; }

  // Allow override via body
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.year  === 'number') year  = body.year;
    if (typeof body.month === 'number') month = body.month;
  } catch { /* no body is fine */ }

  // Idempotency: check if report already exists
  const { data: existing } = await db
    .from('monthly_close_reports')
    .select('id')
    .eq('period_year', year)
    .eq('period_month', month)
    .maybeSingle();

  if (existing) {
    return apiSuccess({ already_exists: true, year, month });
  }

  const periodStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const periodEnd   = new Date(Date.UTC(year, month, 1)).toISOString();

  try {
    const [
      paymentsResult,
      refundsResult,
      tokensIssuedResult,
      tokensExpiredResult,
      newMembersResult,
      membershipRevenueResult,
    ] = await Promise.all([
      // Gross payment revenue
      db.from('payments')
        .select('amount_paise')
        .eq('status', 'captured')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),

      // Total refunds
      db.from('refunds')
        .select('amount_paise')
        .eq('status', 'paid')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),

      // Tokens issued (credit transactions)
      db.from('token_transactions')
        .select('amount')
        .in('type', ['earned', 'bonus', 'credit'])
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),

      // Tokens expired
      db.from('token_transactions')
        .select('amount')
        .eq('type', 'expired')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),

      // New member signups
      db.from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),

      // Membership payment revenue
      db.from('payments')
        .select('amount_paise')
        .eq('status', 'captured')
        .eq('payment_type', 'membership')
        .gte('created_at', periodStart)
        .lt('created_at', periodEnd),
    ]);

    const sum = (rows: Record<string, number>[], key: string) =>
      (rows ?? []).reduce((s, r) => s + (r[key] ?? 0), 0);

    const grossRevenuePaise       = sum(paymentsResult.data as Record<string, number>[] ?? [], 'amount_paise');
    const refundsPaise            = sum(refundsResult.data  as Record<string, number>[] ?? [], 'amount_paise');
    const tokensIssued            = sum(tokensIssuedResult.data as Record<string, number>[] ?? [], 'amount');
    const tokensExpired           = sum(tokensExpiredResult.data as Record<string, number>[] ?? [], 'amount');
    const newMembers              = newMembersResult.count ?? 0;
    const membershipRevenuePaise  = sum(membershipRevenueResult.data as Record<string, number>[] ?? [], 'amount_paise');

    const reportData = {
      gross_revenue_paise:      grossRevenuePaise,
      refunds_paise:            refundsPaise,
      net_revenue_paise:        grossRevenuePaise - refundsPaise,
      membership_revenue_paise: membershipRevenuePaise,
      tokens_issued:            tokensIssued,
      tokens_expired:           tokensExpired,
      new_members:              newMembers,
    };

    const { error: insertError } = await db
      .from('monthly_close_reports')
      .insert({
        period_year:  year,
        period_month: month,
        status:       'closed',
        closed_at:    now.toISOString(),
        data:         reportData,
      });

    if (insertError) {
      console.error('[POST /api/internal/finance/close] insert error:', insertError.message);
      return apiError('Failed to save report.', 500);
    }

    await logAudit({
      action:     'finance.monthly_close',
      actor_type: 'system',
      details:    { year, month, ...reportData },
    });

    return apiSuccess({ year, month, report: reportData });

  } catch (err) {
    console.error('[POST /api/internal/finance/close] unexpected error:', err);
    return apiError('An unexpected error occurred.', 500);
  }
}
