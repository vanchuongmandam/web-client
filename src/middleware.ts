import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const cookies = request.cookies;
  const hasAuthToken = cookies.has('authToken');
  const hasNextAuthToken = cookies.getAll().some(c => c.name.includes('session-token'));

  const isAuthenticated = hasAuthToken || hasNextAuthToken;

  // Paths that are only for guest users (should not be accessible if logged in)
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/link-account';

  if (isAuthenticated && isAuthPage) {
    // If logged in, redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Only match authentication pages to optimize performance
export const config = {
  matcher: ['/login', '/register', '/link-account'],
};
