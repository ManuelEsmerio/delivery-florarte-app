import { NextResponse, type NextRequest } from 'next/server';
import { DRIVER_SESSION_COOKIE, verifyDriverSessionToken } from '@/lib/auth-token';

const PROTECTED_PATHS = ['/dashboard', '/profile', '/orders', '/splash'];
const AUTH_PAGES = ['/login'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(DRIVER_SESSION_COOKIE)?.value;

  let hasValidSession = false;
  let shouldClearCookie = false;

  if (token) {
    try {
      const payload = await verifyDriverSessionToken(token);
      hasValidSession = payload.role === 'DELIVERY';
    } catch {
      hasValidSession = false;
      shouldClearCookie = true;
    }
  }

  if (isProtectedPath(pathname) && !hasValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const response = NextResponse.redirect(loginUrl);

    if (shouldClearCookie) {
      response.cookies.delete(DRIVER_SESSION_COOKIE);
    }

    return response;
  }

  if (isAuthPage(pathname) && hasValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const response = NextResponse.next();

  if (shouldClearCookie) {
    response.cookies.delete(DRIVER_SESSION_COOKIE);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/orders/:path*', '/splash', '/login'],
};