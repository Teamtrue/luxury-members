import { NextRequest, NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db/client';
import { getSecret } from '@/lib/security/secrets';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-job-token');
  const expected = getSecret('INTERNAL_JOB_TOKEN');

  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await dbQuery<{ id: string; email: string; ends_at: string }>(
    `select u.id, u.email, m.ends_at
     from memberships m
     join users u on u.id = m.user_id
     where m.status = 'ACTIVE'
       and m.ends_at <= now() + interval '30 days'
     order by m.ends_at asc
     limit 500`
  );

  await writeAuditLog({
    actorUserId: 'system-job',
    action: 'lifecycle.reminder.scan',
    entityType: 'membership',
    entityId: 'batch',
    metadata: { count: rows.length }
  });

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    candidates: rows.map((r) => ({ userId: r.id, email: r.email, endsAt: r.ends_at }))
  });
}
