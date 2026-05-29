import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import type { AdminSession } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { validate, resolveReconciliationSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments:write');
  if ('error' in auth) return (auth as { error: Response }).error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = validate(resolveReconciliationSchema, body);
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error, details: parsed.details }, { status: 422 });
  }

  const { reconciliation_id, resolution, notes } = parsed.data;

  const db = createServiceRoleClient();
  const { data: record, error } = await db
    .from('payment_reconciliation')
    .update({
      status: resolution,
      notes: notes ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reconciliation_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to resolve reconciliation record' }, { status: 500 });
  }

  const adminId = (auth as { session: { adminUserId: string } }).session.adminUserId;
  await logAudit({
    actor_type: 'admin',
    actor_id: adminId,
    action: 'reconciliation.resolved',
    target_type: 'payment_reconciliation',
    target_id: reconciliation_id,
    details: { resolution, notes },
  });

  return NextResponse.json({ success: true, data: record });
}
