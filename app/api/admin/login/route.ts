import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // TODO: Supabase admin login
  // const supabase = await createClient();
  // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // if (error) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  //
  // // Verify admin role
  // const { data: member } = await supabase.from('members').select('role').eq('id', data.user.id).single();
  // if (!member || !['admin', 'super_admin'].includes(member.role)) {
  //   await supabase.auth.signOut();
  //   return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
  // }

  // Dev mode: accept specific test credentials
  if (process.env.NODE_ENV !== 'production') {
    if (email === 'admin@plutusclub.in' && password === 'admin123') {
      return NextResponse.json({ success: true, role: 'super_admin' });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ error: 'Auth service not configured' }, { status: 503 });
}
