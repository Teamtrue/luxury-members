import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { validate, resolveRefundRequestSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { assertCsrf } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'refunds:write');
  if ('error' in auth) return (auth as { error: Response }).error;

  const csrfError = assertCsrf(request, auth.session.id);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = validate(resolveRefundRequestSchema, body);
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error, details: parsed.details }, { status: 422 });
  }

  const { refund_id, decision, approved_amount_inr, notes } = parsed.data;

  const db = createServiceRoleClient();

  const newStatus = decision === 'approved' ? 'approved'
    : decision === 'partial' ? 'partial'
    : 'rejected';

  const { data: refund, error } = await db
    .from('refunds')
    .update({
      status: newStatus,
      approved_amount_inr: approved_amount_inr ?? null,
      resolution_notes: notes ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', refund_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to resolve refund' }, { status: 500 });
  }

  const adminId = auth.session.adminUserId;
  await logAudit({
    actor_type: 'admin',
    actor_id: adminId,
    action: 'refund.resolved',
    target_type: 'refund',
    target_id: refund_id,
    details: { decision, approved_amount_inr, notes },
  });

  return NextResponse.json({ success: true, data: refund });
}
