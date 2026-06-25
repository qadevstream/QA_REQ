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

    // Sincronizar estado_qa en la iteración vinculada
    if (data.iteration_id) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase
        .from('requirement_iterations')
        .update({ estado_qa: estado })
        .eq('id', data.iteration_id)
    }

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

    // Sincronizar estado_qa en la iteración vinculada cuando cambia el depósito
    if (input.estado && data.iteration_id) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase
        .from('requirement_iterations')
        .update({ estado_qa: input.estado })
        .eq('id', data.iteration_id)
    }

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
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Leer iteration_id y requirement_id antes de eliminar
    const { data: act } = await supabase
      .from('actividades')
      .select('iteration_id, requirement_id')
      .eq('id', id)
      .single()

    await deleteActividad(id)

    // Eliminar la iteración vinculada
    if (act?.iteration_id) {
      await supabase
        .from('requirement_iterations')
        .delete()
        .eq('id', act.iteration_id)

      // Si el req padre queda sin iteraciones, eliminarlo también
      if (act.requirement_id) {
        const { count } = await supabase
          .from('requirement_iterations')
          .select('id', { count: 'exact', head: true })
          .eq('requirement_id', act.requirement_id)

        if ((count ?? 0) === 0) {
          await supabase
            .from('requirements')
            .delete()
            .eq('id', act.requirement_id)
        }
      }
    }

    revalidatePath('/planner')
    revalidatePath('/requirements')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
