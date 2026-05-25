import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { dbQuery } from '@/lib/db/client';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/audit/log';
import { isSameOrigin } from '@/lib/security/origin-check';

const schema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['MATCHED', 'MISMATCHED', 'MISSING_PROVIDER', 'MISSING_INTERNAL']),
  notes: z.string().max(1000).optional()
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Origin check failed' }, { status: 403 });
  }

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('payments.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = schema.safeParse({
    id: Number(raw.id),
    status: raw.status,
    notes: raw.notes
  });
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
