import { createClient } from '@/lib/supabase/server'
import type { Actividad, CreateActividadInput, UpdateActividadInput } from '@/types/domain.types'

const SELECT_WITH_QA = `
  *,
  qa_asignado:profiles!actividades_qa_asignado_id_fkey(id, full_name, role, cargo),
  creado_por:profiles!actividades_created_by_fkey(id, full_name, role, cargo),
  iteration:requirement_iterations!actividades_iteration_id_fkey(iteracion, fecha_inicio_planificada, fecha_entrega_planificada, cp_total, cp_ok, cp_fallo, horas_estimadas, horas_reales),
  requirement:requirements!actividades_requirement_id_fkey(
    requirement_iterations(id, iteracion)
  )
`

function diasEnEstado(estadoChangedAt: string): number {
  const ms = Date.now() - new Date(estadoChangedAt).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function single<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

function normalize(row: Record<string, unknown>): Actividad {
  const iter = single(row.iteration as Record<string, unknown> | null | undefined)
  const req = single(row.requirement as Record<string, unknown> | null | undefined)
  const allIters: { id: string; iteracion: number }[] = (req as any)?.requirement_iterations ?? []
  allIters.sort((a, b) => a.iteracion - b.iteracion)
  return {
    ...row,
    qa_asignado: single(row.qa_asignado),
    creado_por: single(row.creado_por),
    dias_en_estado: diasEnEstado(row.estado_changed_at as string),
    iteracion_num: (iter as any)?.iteracion ?? null,
    iter_fecha_inicio: (iter as any)?.fecha_inicio_planificada ?? null,
    iter_fecha_vencimiento: (iter as any)?.fecha_entrega_planificada ?? null,
    iter_cp_total: (iter as any)?.cp_total ?? 0,
    iter_cp_ok: (iter as any)?.cp_ok ?? 0,
    iter_cp_fallo: (iter as any)?.cp_fallo ?? 0,
    iter_horas_estimadas: (iter as any)?.horas_estimadas ?? 0,
    iter_horas_reales: (iter as any)?.horas_reales ?? 0,
    all_iteraciones: allIters.map(i => ({ id: i.id, iteracion: i.iteracion })),
  } as unknown as Actividad
}

export async function findAllActividades(): Promise<Actividad[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actividades')
    .select(SELECT_WITH_QA)
    .order('estado', { ascending: true })
    .order('posicion', { ascending: true })

  if (error) throw new Error(error.message)

  return (data as unknown as Record<string, unknown>[]).map(normalize)
}

export async function createActividad(
  input: CreateActividadInput & { created_by: string }
): Promise<Actividad> {
  const supabase = await createClient()

  const estado = input.estado ?? 'PEND_ASIGNACION'

  const { data: maxRow } = await supabase
    .from('actividades')
    .select('posicion')
    .eq('estado', estado)
    .order('posicion', { ascending: false })
    .limit(1)
    .maybeSingle()

  const posicion = ((maxRow?.posicion as number | undefined) ?? -1) + 1

  const { data, error } = await supabase
    .from('actividades')
    .insert({ ...input, estado, posicion })
    .select(SELECT_WITH_QA)
    .single()

  if (error) throw new Error(error.message)

  return normalize(data as unknown as Record<string, unknown>)
}

export async function moveActividad(
  id: string,
  estado: Actividad['estado'],
): Promise<Actividad> {
  const supabase = await createClient()

  const { data: maxRow } = await supabase
    .from('actividades')
    .select('posicion')
    .eq('estado', estado)
    .order('posicion', { ascending: false })
    .limit(1)
    .maybeSingle()

  const posicion = ((maxRow?.posicion as number | undefined) ?? -1) + 1

  const { data, error } = await supabase
    .from('actividades')
    .update({ estado, posicion })
    .eq('id', id)
    .select(SELECT_WITH_QA)
    .single()

  if (error) throw new Error(error.message)

  return normalize(data as unknown as Record<string, unknown>)
}

export async function updateActividad(
  id: string,
  input: UpdateActividadInput
): Promise<Actividad> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actividades')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_QA)
    .single()

  if (error) throw new Error(error.message)

  return normalize(data as unknown as Record<string, unknown>)
}

export async function deleteActividad(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('actividades').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
