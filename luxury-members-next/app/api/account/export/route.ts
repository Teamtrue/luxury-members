import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    ok: true,
    export: {
      user: { id: user.id, email: user.email, role: user.role },
      generatedAt: new Date().toISOString()
    }
  });
}
