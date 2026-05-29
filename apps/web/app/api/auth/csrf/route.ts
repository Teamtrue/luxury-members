import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { generateCsrfToken, CSRF_COOKIE } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sessionId = user?.id ?? request.headers.get('x-forwarded-for') ?? '0.0.0.0';
  const token = generateCsrfToken(sessionId);

  const response = NextResponse.json({ token });
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600,
  });
  return response;
}
