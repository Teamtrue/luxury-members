import { NextRequest, NextResponse } from 'next/server';
import { runMembershipRenewalSweep } from '@/lib/jobs/membership-renewal';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = process.env.INTERNAL_JOB_TOKEN;

  if (!token || !expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runMembershipRenewalSweep();
  return NextResponse.json({ ok: true, result });
}
