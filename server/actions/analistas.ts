'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllProfiles } from '@/server/repositories/profiles.repository'
import type { ActionResult, CreateAnalistaInput, Profile } from '@/types/domain.types'

export type AnalistaConCorreo = Profile & { correo: string }

function generateTempPassword(): string {
  return `Qa${Math.random().toString(36).slice(2, 10)}!${Math.floor(Math.random() * 100)}`
}

export async function createAnalistaAction(
  _prevState: ActionResult<AnalistaConCorreo> | null,
  formData: FormData
): Promise<ActionResult<AnalistaConCorreo>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role !== 'SUPERVISOR') {
    return { success: false, error: 'Solo un Supervisor puede crear usuarios.' }
  }

  const input: CreateAnalistaInput = {
    nombre: (formData.get('nombre') as string)?.trim() ?? '',
    cargo: formData.get('cargo') as CreateAnalistaInput['cargo'],
    correo: (formData.get('correo') as string)?.trim().toLowerCase() ?? '',
    dni: (formData.get('dni') as string)?.trim() ?? '',
  }

  if (!input.nombre) return { success: false, error: 'El nombre completo es obligatorio.' }
  if (!input.cargo) return { success: false, error: 'Selecciona un cargo.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.correo)) {
    return { success: false, error: 'Formato de correo inválido.' }
  }
  if (!/^\d{8}$/.test(input.dni)) {
    return { success: false, error: 'El DNI debe tener exactamente 8 dígitos.' }
  }

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.correo,
    password: generateTempPassword(),
    email_confirm: true,
    user_metadata: {
      full_name: input.nombre,
      cargo: input.cargo,
      dni: input.dni,
      role: input.cargo === 'SUPERVISOR_QA' ? 'SUPERVISOR' : 'ANALISTA_QA',
    },
  })

  if (createError) {
    const msg = createError.message.includes('already been registered')
      ? 'Ya existe un usuario con ese correo.'
      : createError.message
    return { success: false, error: msg }
  }

  // El trigger handle_new_user() crea la fila en profiles automáticamente.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', created.user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Usuario creado, pero no se pudo leer su perfil.' }
  }

  revalidatePath('/analistas')
  return {
    success: true,
    data: { ...(profile as Profile), correo: input.correo },
    message: `Usuario creado: ${input.nombre}. Debe restablecer su contraseña desde "¿Olvidaste tu contraseña?" en el login.`,
  }
}

export async function getAnalistasAction(): Promise<ActionResult<AnalistaConCorreo[]>> {
  try {
    const data = await findAnalistasConCorreo()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function findAnalistasConCorreo(): Promise<AnalistaConCorreo[]> {
  const [profiles, admin] = [await findAllProfiles(), createAdminClient()]

  const correoPorId = new Map<string, string>()
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) break
    data.users.forEach((u) => correoPorId.set(u.id, u.email ?? ''))
    if (data.users.length < 200) break
    page += 1
  }

  return profiles.map((p) => ({ ...p, correo: correoPorId.get(p.id) ?? '—' }))
}

export async function deleteAnalistaAction(id: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role !== 'SUPERVISOR') {
    return { success: false, error: 'Solo un Supervisor puede eliminar usuarios.' }
  }
  if (id === session.userId) {
    return { success: false, error: 'No puedes eliminar tu propio usuario.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/analistas')
  return { success: true, data: undefined }
}
