import { NextRequest, NextResponse } from 'next/server';
import { getSecret } from '@/lib/security/secrets';
import { listApprovedRefunds, markRefundPaid } from '@/lib/db/refunds';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = getSecret('INTERNAL_JOB_TOKEN');

  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const approved = await listApprovedRefunds(200);

  let processed = 0;
  for (const item of approved) {
    await markRefundPaid(item.id, 'Processed by internal refund job');
    processed += 1;

    await writeAuditLog({
      actorUserId: 'system-job',
      action: 'refund.payout.processed',
      entityType: 'refund',
      entityId: item.id,
      metadata: { approvedAmountInr: item.approved_amount_inr }
    });
  }

  return NextResponse.json({ ok: true, approved: approved.length, processed });
}
