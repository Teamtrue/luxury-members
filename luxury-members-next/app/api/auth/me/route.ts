import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ authenticated: false });

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.json({ authenticated: false });

  return NextResponse.json({ authenticated: true, user });
}
