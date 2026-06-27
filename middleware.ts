import { NextResponse, type NextRequest } from 'next/server'

function isAuthenticated(request: NextRequest): boolean {
  // Match any @supabase/ssr auth cookie regardless of project ref.
  // Pattern: sb-<projectRef>-auth-token  (single chunk)
  //      or: sb-<projectRef>-auth-token.0  (first chunk of a multi-part cookie)
  return request.cookies.getAll().some(
    ({ name, value }) =>
      value &&
      /^sb-.+-auth-token(\.0)?$/.test(name)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookies = request.cookies.getAll()
  console.log('[MW]', pathname, '| cookies:', cookies.map(c => c.name).join(', ') || '(none)')

  // Rutas públicas de autenticación (login + recuperación de contraseña)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next()
  }

  if (!isAuthenticated(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

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
