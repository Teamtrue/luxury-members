import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { getPaymentProvider } from '@/lib/providers';
import { logAudit } from '@/lib/audit';

function requireJobToken(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.INTERNAL_JOB_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

export async function POST(request: NextRequest) {
  if (!requireJobToken(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceRoleClient();

  // Fetch approved refunds with their linked payment's provider_payment_id
  const { data: refunds, error } = await db
    .from('refunds')
    .select('id, payment_id, amount_paise, reason, status')
    .eq('status', 'approved')
    .is('processed_at', null)
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch refunds' }, { status: 500 });
  }

  // Load the payment gateway provider once (all refunds use same active gateway)
  let provider: Awaited<ReturnType<typeof getPaymentProvider>>;
  try {
    provider = await getPaymentProvider();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Payment provider not configured' },
      { status: 503 }
    );
  }

  const processed: string[] = [];
  const failed: string[] = [];

  for (const refund of refunds ?? []) {
    // Fetch the linked payment to get the gateway's payment ID
    const { data: paymentRow } = await db
      .from('payments')
      .select('provider_payment_id, provider')
      .eq('id', refund.payment_id as string)
      .maybeSingle();

    const providerPaymentId = (paymentRow as { provider_payment_id: string | null } | null)?.provider_payment_id;

    if (!providerPaymentId) {
      // Cannot refund without a captured payment ID — skip and flag
      console.error(`[refunds/process] Refund ${refund.id} has no provider_payment_id on linked payment`);
      failed.push(refund.id);
      continue;
    }

    // Optimistic lock: mark as processing so concurrent runs skip this refund
    const { error: lockError } = await db
      .from('refunds')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', refund.id)
      .eq('status', 'approved');

    if (lockError) {
      failed.push(refund.id);
      continue;
    }

    try {
      // Call the payment gateway refund API
      const result = await provider.processRefund({
        providerPaymentId,
        amountPaise: refund.amount_paise,
        reason: refund.reason ?? undefined,
      });

      // Mark as paid and store the gateway-issued refund ID
      await db
        .from('refunds')
        .update({
          status: 'paid',
          provider_refund_id: result.providerRefundId,
        })
        .eq('id', refund.id);

      await logAudit({
        actor_type: 'system',
        actor_id: 'system',
        action: 'refund.processed',
        target_type: 'refund',
        target_id: refund.id,
        details: {
          amount_paise: refund.amount_paise,
          provider_refund_id: result.providerRefundId,
          provider_payment_id: providerPaymentId,
        },
      });

      processed.push(refund.id);
    } catch (err) {
      console.error(`[refunds/process] Gateway refund failed for refund ${refund.id}:`, err);

      // Reset to 'approved' so the next scheduled run retries
      await db
        .from('refunds')
        .update({ status: 'approved', processed_at: null })
        .eq('id', refund.id);

      await logAudit({
        actor_type: 'system',
        actor_id: 'system',
        action: 'refund.gateway_error',
        target_type: 'refund',
        target_id: refund.id,
        details: {
          error: err instanceof Error ? err.message : String(err),
          provider_payment_id: providerPaymentId,
        },
      });

      failed.push(refund.id);
    }
  }

  return NextResponse.json({
    success: true,
    data: { processed: processed.length, failed: failed.length, processed_ids: processed },
  });
}
