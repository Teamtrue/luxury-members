import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { validate, createRefundRequestSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = validate(createRefundRequestSchema, body);
  if ('error' in parsed) {
    return NextResponse.json({ success: false, error: parsed.error, details: parsed.details }, { status: 422 });
  }

  const { booking_id, reason, requested_amount_inr } = parsed.data;

  // Verify booking belongs to this user
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, user_id')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (!['confirmed', 'pending_payment'].includes(booking.status)) {
    return NextResponse.json(
      { success: false, error: 'Refund can only be requested for confirmed or pending bookings' },
      { status: 400 }
    );
  }

  const { data: refund, error: refundError } = await supabase
    .from('refunds')
    .insert({
      booking_id,
      user_id: user.id,
      reason,
      requested_amount_inr: requested_amount_inr ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (refundError) {
    return NextResponse.json({ success: false, error: 'Failed to create refund request' }, { status: 500 });
  }

  await logAudit({
    actor_type: 'member',
    actor_id: user.id,
    action: 'refund.requested',
    target_type: 'refund',
    target_id: refund.id,
    details: { booking_id, reason },
  });

  return NextResponse.json({ success: true, data: refund }, { status: 201 });
}
