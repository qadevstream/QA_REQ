'use server'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/domain.types'
import type { Profile } from '@/types/domain.types'

export async function signInAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son obligatorios.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      success: false,
      error: error.message === 'Invalid login credentials'
        ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
        : error.message,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role
  // Devolver redirectTo en lugar de llamar redirect(): useActionState usa soft-navigation
  // que NO procesa Set-Cookie, impidiendo que el middleware reciba la sesión.
  // El cliente hace window.location.href (hard navigation) para que las cookies sean
  // procesadas por el browser antes del siguiente request al middleware.
  return {
    success: true,
    data: undefined,
    redirectTo: role === 'CLIENTE' ? '/requirements' : '/dashboard',
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export const getCurrentUser = cache(async (): Promise<{
  userId: string
  profile: Profile
} | null> => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { userId: user.id, profile: profile as Profile }
})
