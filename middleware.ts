import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip middleware if env vars not set (dev without Supabase)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Protect /member/* routes
  if (pathname.startsWith('/member') && !user) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // Protect /admin/* routes (check admin role)
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/member/:path*', '/admin/:path*'],
};
