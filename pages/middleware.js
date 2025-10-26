import { NextResponse } from 'next/server';

export function middleware(req) {
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return res;
}

export const config = {
  matcher: '/:path*', // applies to every route and API
};
