import { NextRequest, NextResponse } from 'next/server';
import { addReconciliationRecord } from '@/lib/db/reconciliation';
import { getSecret } from '@/lib/security/secrets';
import { emitSiemEvent } from '@/lib/security/siem';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = getSecret('INTERNAL_JOB_TOKEN');

  if (!token || token !== expected) {
    await emitSiemEvent({ type: 'internal_job_auth_failed', job: 'reconciliation_run', ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providerOrderId = `recon_${crypto.randomUUID()}`;
  await addReconciliationRecord({
    providerOrderId,
    status: 'MISSING_INTERNAL',
    notes: 'Synthetic reconciliation check entry'
  });

  await emitSiemEvent({ type: 'internal_job_success', job: 'reconciliation_run', providerOrderId, ts: new Date().toISOString() });
  return NextResponse.json({ ok: true, message: 'Reconciliation run completed (skeleton)' });
}
