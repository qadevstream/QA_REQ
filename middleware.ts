import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Toda redirección debe llevar las cookies (posiblemente refrescadas)
  // que Supabase escribió en supabaseResponse — si no, el navegador se
  // queda con el refresh token viejo ya rotado y la sesión se rompe.
  function redirectTo(path: string) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Ruta de login
  if (pathname.startsWith('/login')) {
    if (user) {
      // CLIENTE va directo a Requerimientos
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      return redirectTo(profile?.role === 'CLIENTE' ? '/requirements' : '/dashboard')
    }
    return supabaseResponse
  }

  // Proteger todas las demás rutas
  if (!user) {
    return redirectTo('/login')
  }

  // Redirect raíz → dashboard
  if (pathname === '/') {
    return redirectTo('/dashboard')
  }

  // CLIENTE solo puede acceder a /requirements
  if (!pathname.startsWith('/requirements')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'CLIENTE') {
      return redirectTo('/requirements')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
