import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/stream'];
const AUTH_ROUTES = ['/login', '/register'];
const AUTH_COOKIE = 'auth_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = !!token;

  // Check if the current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  console.log(`[Middleware] ${pathname} - Authenticated: ${isAuthenticated}`);

  // If user is not authenticated and tries to access protected route
  if (!isAuthenticated && isProtectedRoute) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and tries to access auth routes, redirect to stream
  if (isAuthenticated && isAuthRoute) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /stream`);
    return NextResponse.redirect(new URL('/stream', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};