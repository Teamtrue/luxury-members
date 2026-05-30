import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { validate, resolveDisputeSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { assertCsrf } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'payments:write');
  if ('error' in auth) return auth.error;

  const csrfError = assertCsrf(request, auth.session.id);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = validate(resolveDisputeSchema, body);
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error, details: parsed.details }, { status: 422 });
  }

  const { dispute_id, status, resolution_notes } = parsed.data;

  const db = createServiceRoleClient();
  const { data: dispute, error } = await db
    .from('payment_disputes')
    .update({
      status,
      resolution_notes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', dispute_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to resolve dispute' }, { status: 500 });
  }

  const adminId = auth.session.adminUserId;
  await logAudit({
    actor_type: 'admin',
    actor_id: adminId,
    action: 'dispute.resolved',
    target_type: 'payment_dispute',
    target_id: dispute_id,
    details: { status, resolution_notes },
  });

  return NextResponse.json({ success: true, data: dispute });
}
