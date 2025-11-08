import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Proxy: Redirect browser navigations to /api* back to home.
 */
export function proxy(req: NextRequest) {
  const { method, headers } = req;

  // Only consider true document requests
  const secFetchDest = headers.get('sec-fetch-dest') ?? '';
  const secFetchMode = headers.get('sec-fetch-mode') ?? '';
  const accept = headers.get('accept') ?? '';

  const isNavigation =
    secFetchMode === 'navigate' || secFetchDest === 'document' || accept.includes('text/html');

  // Only redirect safe navigation methods; avoid POST/PUT/PATCH/DELETE/OPTIONS/etc.
  const isSafeMethod = method === 'GET' || method === 'HEAD';

  if (isNavigation && isSafeMethod) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run this proxy for all /api routes
  matcher: ['/api/:path*'],
};
