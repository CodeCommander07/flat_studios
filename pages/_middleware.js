export function middleware(req, ev) {
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return res;
}
