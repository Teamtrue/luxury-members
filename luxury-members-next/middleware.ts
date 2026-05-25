import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));

  const user = await verifySessionToken(token);
  if (!user) return NextResponse.redirect(new URL('/admin/login', req.url));

  if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
