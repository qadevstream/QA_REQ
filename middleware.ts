import { NextResponse, type NextRequest } from 'next/server'

// Derive cookie name from the Supabase project URL.
// createBrowserClient (and createServerClient) both use this naming convention.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const PROJECT_REF  = SUPABASE_URL.split('//')[1]?.split('.')[0] ?? ''
const AUTH_COOKIE  = `sb-${PROJECT_REF}-auth-token`

function isAuthenticated(request: NextRequest): boolean {
  // @supabase/ssr stores the session in AUTH_COOKIE or chunked as AUTH_COOKIE.0
  return (
    !!request.cookies.get(AUTH_COOKIE)?.value ||
    !!request.cookies.get(`${AUTH_COOKIE}.0`)?.value
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Login is always accessible
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // No auth cookie → redirect to login
  if (!isAuthenticated(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Root → dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
