import { NextRequest, NextResponse } from 'next/server';

// Pages that DON'T require login
const PUBLIC_PATHS = [
  '/',
  '/auth/signin',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/analytics/track',
  '/api/admin/stats',
];

const COOKIE = 'cr_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public/') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = req.cookies.get(COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
