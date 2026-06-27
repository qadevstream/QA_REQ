'use server'

import { revalidatePath } from 'next/cache'
import {
  findAllRegistroDiario,
  createRegistroDiario,
  updateRegistroDiario,
  bulkCreateRegistroDiario,
  deleteRegistroDiario,
} from '@/server/repositories/registroDiario.repository'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { TIPO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import { resolveAplicativoByCodigo } from '@/lib/aplicativos'
import { resolveEnumValue, parseFecha } from '@/lib/import-helpers'
import type { ActionResult, RegistroDiario, CreateRegistroDiarioInput } from '@/types/domain.types'

async function syncHorasReales(nro_ticket: string) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('sync_horas_reales', { p_nro_ticket: nro_ticket })
}

export async function getRegistroDiarioAction(filters: {
  qa_id?: string
  periodo?: string
} = {}): Promise<ActionResult<RegistroDiario[]>> {
  try {
    const data = await findAllRegistroDiario(filters)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function createRegistroDiarioAction(
  input: CreateRegistroDiarioInput
): Promise<ActionResult<RegistroDiario>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (!input.periodo?.trim()) return { success: false, error: 'El período es obligatorio.' }
  if (!input.horas_ejecutadas || input.horas_ejecutadas <= 0) {
    return { success: false, error: 'Las horas ejecutadas deben ser mayores a 0.' }
  }

  try {
    // Si no se especifica QA, se asigna automáticamente al usuario que registra.
    const data = await createRegistroDiario({
      ...input,
      qa_id: input.qa_id ?? session.userId,
      created_by: session.userId,
    })

    if (data.nro_ticket) {
      await syncHorasReales(data.nro_ticket)
      revalidatePath('/requirements')
    }

    revalidatePath('/actividades')
    return { success: true, data, message: 'Actividad registrada.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Importación masiva desde Excel/CSV (solo Supervisor) ─────────

export interface ImportRow {
  periodo?: string
  iteracion?: string | number
  aplicativo?: string
  codigo_app?: string
  tipo_solicitud?: string
  tipo_tarea?: string
  horas_ejecutadas?: string | number
  perfil?: string
  nro_ticket?: string
  fecha_reporte?: string
  observaciones?: string
}

export async function bulkImportRegistroDiarioAction(
  rows: ImportRow[],
  qaId: string
): Promise<ActionResult<{ creados: number; omitidos: number }>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') {
    return { success: false, error: 'Solo un Supervisor puede importar registros masivamente.' }
  }
  if (!qaId) return { success: false, error: 'Selecciona el analista destino.' }

  const catalogoAplicativos = await findAllAplicativos(false)
  const toInsert: (CreateRegistroDiarioInput & { created_by: string })[] = []
  let omitidos = 0

  for (const row of rows) {
    const periodo = row.periodo?.trim()
    const horas = Number(row.horas_ejecutadas)

    if (!periodo || !horas || horas <= 0) {
      omitidos++
      continue
    }

    toInsert.push({
      periodo,
      iteracion: row.iteracion ? Number(row.iteracion) : undefined,
      aplicativo: resolveAplicativoByCodigo(row.aplicativo, catalogoAplicativos),
      codigo_app: row.codigo_app?.trim() || undefined,
      tipo_solicitud: resolveEnumValue(row.tipo_solicitud, TIPO_REQUERIMIENTO_LABELS) as CreateRegistroDiarioInput['tipo_solicitud'],
      tipo_tarea: row.tipo_tarea?.trim() || undefined,
      qa_id: qaId,
      horas_ejecutadas: horas,
      perfil: row.perfil?.trim() || undefined,
      nro_ticket: row.nro_ticket?.trim() || undefined,
      // fecha_reporte es NOT NULL en la BD. En un insert masivo, Postgres
      // no aplica el DEFAULT por fila si otras filas del mismo lote sí
      // traen el campo — así que si no se pudo parsear, usamos hoy.
      fecha_reporte: parseFecha(row.fecha_reporte) ?? new Date().toISOString().slice(0, 10),
      observaciones: row.observaciones?.trim() || undefined,
      created_by: session.userId,
    })
  }

  if (toInsert.length === 0) {
    return { success: false, error: 'Ninguna fila tenía Período y Horas Ejecutadas válidos.' }
  }

  try {
    await bulkCreateRegistroDiario(toInsert)
    revalidatePath('/actividades')
    return {
      success: true,
      data: { creados: toInsert.length, omitidos },
      message: `${toInsert.length} actividad${toInsert.length !== 1 ? 'es' : ''} importada${toInsert.length !== 1 ? 's' : ''}${omitidos > 0 ? ` (${omitidos} omitida${omitidos !== 1 ? 's' : ''} por datos incompletos)` : ''}.`,
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateRegistroDiarioAction(
  id: string,
  input: Partial<import('@/types/domain.types').CreateRegistroDiarioInput>
): Promise<ActionResult<import('@/types/domain.types').RegistroDiario>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  try {
    const data = await updateRegistroDiario(id, input)
    if (data.nro_ticket) {
      await syncHorasReales(data.nro_ticket)
      revalidatePath('/requirements')
    }
    revalidatePath('/actividades')
    return { success: true, data, message: 'Registro actualizado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteRegistroDiarioAction(id: string): Promise<ActionResult> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: row } = await supabase
      .from('registro_diario')
      .select('nro_ticket')
      .eq('id', id)
      .single() as { data: { nro_ticket?: string | null } | null }

    await deleteRegistroDiario(id)

    if (row?.nro_ticket) {
      await syncHorasReales(row.nro_ticket)
      revalidatePath('/requirements')
    }

    revalidatePath('/actividades')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
