import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=Completa+todos+los+campos', request.url))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message === 'Invalid login credentials'
      ? 'Credenciales+incorrectas'
      : encodeURIComponent(error.message)
    return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const redirectTo = profile?.role === 'CLIENTE' ? '/requirements' : '/dashboard'

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Copiar las cookies de sesión a la respuesta final
  cookieStore.getAll().forEach(({ name, value }) => {
    const existing = response.cookies.get(name)
    if (!existing) response.cookies.set(name, value)
  })

  return response
}
