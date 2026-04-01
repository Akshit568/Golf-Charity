// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED_ROUTES = ['/dashboard', '/admin'];
const AUTH_ROUTES      = ['/login', '/subscribe'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token        = req.cookies.get('golf_session')?.value;

  const isProtected  = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute  = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const user = await verifyToken(token);
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('golf_session');
      return res;
    }

    // Admin-only routes
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && token) {
    const user = await verifyToken(token);
    if (user) {
      return NextResponse.redirect(
        new URL(user.role === 'ADMIN' ? '/admin' : '/dashboard', req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/subscribe',
  ],
};
