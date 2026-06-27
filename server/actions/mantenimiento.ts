'use server'

import { revalidatePath } from 'next/cache'
import {
  createAplicativo,
  updateAplicativo,
  deleteAplicativo,
} from '@/server/repositories/aplicativosCatalogo.repository'
import {
  createCatAplicativo,
  updateCatAplicativo,
  deleteCatAplicativo,
} from '@/server/repositories/catAplicativo.repository'
import {
  createCatTipoTarea,
  updateCatTipoTarea,
  deleteCatTipoTarea,
} from '@/server/repositories/catTipoTarea.repository'
import { getCurrentUser } from '@/server/actions/auth'
import type { ActionResult, AplicativoCatalogo, CatAplicativo, CatTipoTarea } from '@/types/domain.types'

async function requireSupervisor() {
  const session = await getCurrentUser()
  if (!session) return { error: 'No autenticado.' }
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') return { error: 'Solo un Supervisor puede modificar el catálogo.' }
  return { session }
}

export async function createAplicativoAction(
  input: { codigo: string; nombre: string; color?: string; ati_responsable?: string; correo?: string; aplicativo_grupo?: string }
): Promise<ActionResult<AplicativoCatalogo>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.codigo.trim()) return { success: false, error: 'El código es obligatorio.' }
  if (!input.nombre.trim()) return { success: false, error: 'El nombre es obligatorio.' }

  try {
    const data = await createAplicativo({
      codigo: input.codigo.trim().toUpperCase(),
      nombre: input.nombre.trim(),
      color: input.color ?? '#94A3B8',
      activo: true,
      orden: 999,
      ati_responsable: input.ati_responsable?.trim() || null,
      correo: input.correo?.trim() || null,
      aplicativo_grupo: input.aplicativo_grupo?.trim() || null,
    })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateAplicativoAction(
  codigo: string,
  input: { nombre?: string; color?: string; activo?: boolean; ati_responsable?: string | null; correo?: string | null; aplicativo_grupo?: string | null }
): Promise<ActionResult<AplicativoCatalogo>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateAplicativo(codigo, input)
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo actualizado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteAplicativoAction(codigo: string): Promise<ActionResult> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteAplicativo(codigo)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── cat_aplicativo ────────────────────────────────────────────────

export async function createCatAplicativoAction(
  input: { aplicativo: string }
): Promise<ActionResult<CatAplicativo>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.aplicativo.trim()) return { success: false, error: 'El nombre del aplicativo es obligatorio.' }

  try {
    const data = await createCatAplicativo({ aplicativo: input.aplicativo.trim(), activo: true, orden: 999 })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateCatAplicativoAction(
  aplicativo: string,
  input: { activo?: boolean }
): Promise<ActionResult<CatAplicativo>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateCatAplicativo(aplicativo, input)
    revalidatePath('/mantenimiento')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteCatAplicativoAction(aplicativo: string): Promise<ActionResult> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteCatAplicativo(aplicativo)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── cat_tipo_tarea ────────────────────────────────────────────────

export async function createCatTipoTareaAction(
  input: { tipo_tarea: string }
): Promise<ActionResult<CatTipoTarea>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.tipo_tarea.trim()) return { success: false, error: 'El tipo de tarea es obligatorio.' }

  try {
    const data = await createCatTipoTarea({ tipo_tarea: input.tipo_tarea.trim(), activo: true, orden: 999 })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Tipo de tarea creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateCatTipoTareaAction(
  tipo_tarea: string,
  input: { activo?: boolean }
): Promise<ActionResult<CatTipoTarea>> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateCatTipoTarea(tipo_tarea, input)
    revalidatePath('/mantenimiento')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteCatTipoTareaAction(tipo_tarea: string): Promise<ActionResult> {
  const check = await requireSupervisor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteCatTipoTarea(tipo_tarea)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
