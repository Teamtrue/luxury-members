import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: disputes, error } = await supabase
    .from('payment_disputes')
    .select('id, booking_id, reason, description, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch disputes' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: disputes ?? [] });
}
