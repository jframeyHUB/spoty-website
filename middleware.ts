import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Keeps the Supabase sign-in session fresh and sends signed-out visitors to /login for member-only pages.
const MEMBERS_ONLY = ['/onboarding', '/get-votes', '/notifications', '/profile', '/settings', '/admin'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && MEMBERS_ONLY.some((p) => path === p || path.startsWith(p + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Skip static files, the marketing homepage and the email/waitlist API.
  matcher: ['/((?!_next/|assets/|brand/|api/|favicon.ico|home.html|privacy.html|styles.css|script.js|leaderboard.js|$).*)']
};
