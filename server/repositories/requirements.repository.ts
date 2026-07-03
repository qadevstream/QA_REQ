import { createClient } from '@/lib/supabase/server'
import type {
  Requirement,
  RequirementFilters,
  CreateRequirementInput,
  RequirementIteration,
  CreateRequirementIterationInput,
} from '@/types/domain.types'

const SELECT_WITH_QA = `
  *,
  responsable_qa:profiles!requirements_responsable_qa_id_fkey(id, full_name, role, cargo),
  qa_apoyo_1:profiles!requirements_qa_apoyo_1_id_fkey(id, full_name, role, cargo),
  qa_apoyo_2:profiles!requirements_qa_apoyo_2_id_fkey(id, full_name, role, cargo),
  qa_apoyo_3:profiles!requirements_qa_apoyo_3_id_fkey(id, full_name, role, cargo),
  iterations:requirement_iterations(*, actividades!actividades_iteration_id_fkey(estado, progreso))
`

function normalize(row: Record<string, unknown>): Requirement {
  const single = (v: unknown) => (Array.isArray(v) ? v[0] ?? null : v)
  const rawIters = (row.iterations as any[] | null) ?? []
  rawIters.sort((a, b) => a.iteracion - b.iteracion)
  const iterations: RequirementIteration[] = rawIters.map((it) => {
    const act = Array.isArray(it.actividades) ? it.actividades[0] ?? null : it.actividades ?? null
    const { actividades: _, ...rest } = it
    return {
      ...rest,
      actividad_estado: act?.estado ?? null,
      actividad_progreso: act?.progreso ?? null,
    }
  })
  return {
    ...row,
    responsable_qa: single(row.responsable_qa),
    qa_apoyo_1: single(row.qa_apoyo_1),
    qa_apoyo_2: single(row.qa_apoyo_2),
    qa_apoyo_3: single(row.qa_apoyo_3),
    iterations,
  } as unknown as Requirement
}

export async function findAllRequirements(
  filters: RequirementFilters = {}
): Promise<Requirement[]> {
  const supabase = await createClient()

  let query = supabase
    .from('requirements')
    .select(SELECT_WITH_QA)
    .order('created_at', { ascending: false })

  if (filters.aplicativo && filters.aplicativo !== 'ALL') {
    query = query.eq('aplicativo', filters.aplicativo)
  }
  if (filters.responsable_qa_id && filters.responsable_qa_id !== 'ALL') {
    query = query.eq('responsable_qa_id', filters.responsable_qa_id)
  }
  if (filters.search) {
    query = query.or(
      `titulo.ilike.%${filters.search}%,codigo_requerimiento.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  let result = (data as unknown as Record<string, unknown>[]).map(normalize)

  // Filtro "Último Estado QA": la ÚLTIMA iteración (mayor número) debe estar en
  // ese estado. Se resuelve en memoria porque un filtro embebido de PostgREST
  // filtra las iteraciones, no el requerimiento padre, y no distingue la última.
  if (filters.estado_qa && filters.estado_qa !== 'ALL') {
    result = result.filter((r) => {
      const iters = r.iterations ?? []
      return iters[iters.length - 1]?.estado_qa === filters.estado_qa
    })
  }

  return result
}

export async function findRequirementById(id: string): Promise<Requirement | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requirements')
    .select(SELECT_WITH_QA)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return normalize(data as unknown as Record<string, unknown>)
}

export async function findRequirementByCode(code: string): Promise<{ id: string } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requirements')
    .select('id')
    .eq('codigo_requerimiento', code)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function createRequirement(
  input: CreateRequirementInput & { created_by: string }
): Promise<Requirement> {
  const supabase = await createClient()
  const { firstIteration, ...parentFields } = input

  const { data, error } = await supabase
    .from('requirements')
    .insert(parentFields)
    .select('id, codigo_requerimiento, aplicativo, ati_responsable, responsable_qa_id')
    .single()

  if (error) throw new Error(error.message)

  // Crear primera iteración
  const iterInput: CreateRequirementIterationInput = {
    ...firstIteration,
    requirement_id: data.id,
    iteracion: 1,
  }
  await createRequirementIteration(iterInput, input.created_by)

  return findRequirementById(data.id) as Promise<Requirement>
}

// ─── Iteraciones ─────────────────────────────────────────────────────────────

export async function createRequirementIteration(
  input: CreateRequirementIterationInput,
  created_by: string
): Promise<RequirementIteration> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requirement_iterations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...input, created_by } as any)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as RequirementIteration
}

export async function updateRequirementIteration(
  id: string,
  fields: Partial<CreateRequirementIterationInput>
): Promise<RequirementIteration> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requirement_iterations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ ...fields, updated_at: new Date().toISOString() } as any)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as RequirementIteration
}

export async function getNextIteracionNumber(requirement_id: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requirement_iterations')
    .select('iteracion')
    .eq('requirement_id', requirement_id)
    .order('iteracion', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.iteracion ?? 0) + 1
}

// ─── Utilidades import masivo ─────────────────────────────────────────────────

export async function findExistingCodeIters(
  pairs: { codigo: string; iteracion: number }[]
): Promise<Set<string>> {
  if (pairs.length === 0) return new Set()
  const supabase = await createClient()

  const codes = [...new Set(pairs.map((p) => p.codigo))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('requirements')
    .select('id, codigo_requerimiento, requirement_iterations(iteracion)')
    .in('codigo_requerimiento', codes)

  if (error) throw new Error(error.message)

  const existing = new Set<string>()
  for (const r of data ?? []) {
    const iters = r.requirement_iterations as { iteracion: number }[] ?? []
    for (const it of iters) {
      existing.add(`${r.codigo_requerimiento}||${it.iteracion}`)
    }
  }
  return existing
}

export interface RequirementSummary {
  id: string
  codigo_requerimiento: string
  titulo: string | null
  aplicativo: string | null
  ati_responsable: string | null
  responsable_qa_id: string | null
}

export async function findRequirementsSummary(): Promise<RequirementSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requirements')
    .select('id, codigo_requerimiento, titulo, aplicativo, ati_responsable, responsable_qa_id')
    .order('codigo_requerimiento', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as RequirementSummary[]
}

export async function deleteRequirement(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('requirements').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function bulkCreateRequirements(
  rows: (CreateRequirementInput & { created_by: string; iteracion?: number; iterationData?: Partial<CreateRequirementIterationInput> })[],
  chunkSize = 200
): Promise<{ id: string; codigo_requerimiento: string; aplicativo: string; ati_responsable: string | null; responsable_qa_id: string | null }[]> {
  const supabase = await createClient()
  const created: { id: string; codigo_requerimiento: string; aplicativo: string; ati_responsable: string | null; responsable_qa_id: string | null }[] = []

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const parentRows = chunk.map(({ firstIteration: _, iteracion: __, iterationData: ___, ...rest }) => rest)
    const { data, error } = await supabase
      .from('requirements')
      .insert(parentRows)
      .select('id, codigo_requerimiento, aplicativo, ati_responsable, responsable_qa_id')

    if (error) throw new Error(error.message)

    // Crear iteración por cada req insertado
    const iterRows = (data ?? []).map((req, idx) => ({
      requirement_id: req.id,
      iteracion: chunk[idx]?.iteracion ?? 1,
      created_by: chunk[idx]?.created_by ?? null,
      ...(chunk[idx]?.iterationData ?? {}),
    }))

    if (iterRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: iterError } = await (supabase as any)
        .from('requirement_iterations')
        .insert(iterRows)
      if (iterError) throw new Error(iterError.message)
    }

    created.push(...(data ?? []))
  }

  return created
}

export async function countRequirements(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('requirements')
    .select('*', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}
