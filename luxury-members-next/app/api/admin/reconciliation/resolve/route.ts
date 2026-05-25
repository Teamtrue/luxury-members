import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { dbQuery } from '@/lib/db/client';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/audit/log';

const schema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['MATCHED', 'MISMATCHED', 'MISSING_PROVIDER', 'MISSING_INTERNAL']),
  notes: z.string().max(1000).optional()
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  await dbQuery(
    `update payment_reconciliation set status = $2, notes = $3 where id = $1`,
    [parsed.data.id, parsed.data.status, parsed.data.notes || null]
  );

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'reconciliation.resolve',
    entityType: 'payment_reconciliation',
    entityId: String(parsed.data.id),
    metadata: parsed.data
  });

  return NextResponse.json({ ok: true });
}
