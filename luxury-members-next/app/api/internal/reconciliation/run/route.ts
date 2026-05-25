import { NextRequest, NextResponse } from 'next/server';
import { addReconciliationRecord } from '@/lib/db/reconciliation';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = process.env.INTERNAL_JOB_TOKEN;

  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await addReconciliationRecord({
    providerOrderId: `recon_${crypto.randomUUID()}`,
    status: 'MISSING_INTERNAL',
    notes: 'Synthetic reconciliation check entry'
  });

  return NextResponse.json({ ok: true, message: 'Reconciliation run completed (skeleton)' });
}
