import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return NextResponse.redirect(
      new URL('/login?error=Completa+todos+los+campos', request.url),
      { status: 303 },
    )
  }

  // Collect cookies Supabase wants to set, then apply them to the final response
  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => pendingCookies.push(c))
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg =
      error.message === 'Invalid login credentials'
        ? 'Credenciales+incorrectas'
        : encodeURIComponent(error.message)
    return NextResponse.redirect(
      new URL(`/login?error=${msg}`, request.url),
      { status: 303 },
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const destination = profile?.role === 'CLIENTE' ? '/requirements' : '/dashboard'

  // 303 See Other → browser follows with GET, preserving Set-Cookie from this response
  const response = NextResponse.redirect(new URL(destination, request.url), { status: 303 })

  pendingCookies.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}
