'use server'

import { revalidatePath } from 'next/cache'
import {
  findAllActividades,
  createActividad,
  moveActividad,
  updateActividad,
  deleteActividad,
} from '@/server/repositories/actividades.repository'
import { getCurrentUser } from '@/server/actions/auth'
import type { ActionResult, Actividad, CreateActividadInput, UpdateActividadInput } from '@/types/domain.types'

export async function getActividadesAction(): Promise<ActionResult<Actividad[]>> {
  try {
    const data = await findAllActividades()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function createActividadAction(
  input: CreateActividadInput
): Promise<ActionResult<Actividad>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (!input.tck?.trim()) return { success: false, error: 'El número de ticket es obligatorio.' }

  try {
    const data = await createActividad({ ...input, created_by: session.userId })
    revalidatePath('/planner')
    return { success: true, data, message: `Tarea ${data.tck} creada.` }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function moveActividadAction(
  id: string,
  estado: Actividad['estado']
): Promise<ActionResult<Actividad>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  try {
    const data = await moveActividad(id, estado)
    revalidatePath('/planner')
    revalidatePath('/requirements')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateActividadAction(
  id: string,
  input: UpdateActividadInput
): Promise<ActionResult<Actividad>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  try {
    const data = await updateActividad(id, input)
    revalidatePath('/planner')
    revalidatePath('/requirements')
    return { success: true, data, message: 'Tarea actualizada.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteActividadAction(id: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  try {
    await deleteActividad(id)
    revalidatePath('/planner')
    revalidatePath('/requirements')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
