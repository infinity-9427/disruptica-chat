import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/stream'];
const AUTH_ROUTES = ['/login', '/register'];
const AUTH_COOKIE = 'auth_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = !!token;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );


  if (!isAuthenticated && isProtectedRoute) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /stream`);
    return NextResponse.redirect(new URL('/stream', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};