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

  // IMPORTANTE: no ejecutar nada entre createServerClient y getUser().
  // getUser() refresca el token si expiró y actualiza supabaseResponse con las
  // nuevas cookies — devolver supabaseResponse al final es obligatorio para que
  // el navegador reciba los tokens renovados.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // /login siempre carga sin redirección desde el middleware.
  // La propia página detecta si ya hay sesión activa y redirige al dashboard.
  // Esto elimina el loop login ↔ dashboard que ocurre cuando las cookies del
  // redirect no se propagan correctamente en producción.
  if (pathname.startsWith('/login')) {
    return supabaseResponse
  }

  // Proteger todas las rutas privadas
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect raíz → dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // CLIENTE solo puede acceder a /requirements
  if (!pathname.startsWith('/requirements')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'CLIENTE') {
      const url = request.nextUrl.clone()
      url.pathname = '/requirements'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
