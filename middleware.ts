import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

type SetAllParam = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login pages and public routes
  if (pathname === '/admin/login' || pathname === '/signin' || pathname === '/signup') {
    return NextResponse.next({ request });
  }

  // Skip auth if Supabase not configured (dev without .env)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // In dev without Supabase, only block if trying to access protected routes
    // Allow everything — developer is responsible for not shipping without env vars
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: SetAllParam) {
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

  // Protect /admin/* routes — require admin role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // Check role claim from user metadata
    const role = user.user_metadata?.role ?? user.app_metadata?.role;
    if (!role || !['admin', 'super_admin'].includes(role)) {
      // Authenticated but not admin — redirect to member area
      return NextResponse.redirect(new URL('/member', request.url));
    }
  }

  // Protect /member/* routes — require any authenticated user
  if (pathname.startsWith('/member')) {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/member/:path*', '/admin/:path*', '/signin', '/signup'],
};
