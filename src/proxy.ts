import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isPublicRoute } from '@/lib/public-route';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicRoute(pathname);
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (isPublic && refreshToken) {
    const url = new URL('/', request.url);

    return NextResponse.redirect(url);
  }

  if (!isPublic && !refreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
