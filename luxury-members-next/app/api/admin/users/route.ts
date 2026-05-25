import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { dbQuery } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const actor = await verifySessionToken(token);
  if (!actor || !can('users.read', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await dbQuery<{ id: string; email: string; full_name: string | null; role: string; is_active: boolean; created_at: string }>(
    `select id, email, full_name, role, is_active, created_at from users order by created_at desc limit 200`
  );

  return NextResponse.json({ ok: true, users });
}
