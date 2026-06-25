import { createClient } from '@/lib/supabase/server'
import type { RegistroDiario, CreateRegistroDiarioInput } from '@/types/domain.types'

const SELECT_WITH_QA = `
  *,
  qa:profiles!registro_diario_qa_id_fkey(id, full_name, role, cargo)
`

function normalize(row: Record<string, unknown>): RegistroDiario {
  const qa = row.qa
  return {
    ...row,
    qa: Array.isArray(qa) ? qa[0] ?? null : qa ?? null,
  } as unknown as RegistroDiario
}

export async function findAllRegistroDiario(filters: {
  qa_id?: string
  periodo?: string
} = {}): Promise<RegistroDiario[]> {
  const supabase = await createClient()

  let query = supabase
    .from('registro_diario')
    .select(SELECT_WITH_QA)
    .order('fecha_reporte', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.qa_id) query = query.eq('qa_id', filters.qa_id)
  if (filters.periodo) query = query.eq('periodo', filters.periodo)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return (data as unknown as Record<string, unknown>[]).map(normalize)
}

export async function createRegistroDiario(
  input: CreateRegistroDiarioInput & { created_by: string }
): Promise<RegistroDiario> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registro_diario')
    .insert(input)
    .select(SELECT_WITH_QA)
    .single()

  if (error) throw new Error(error.message)

  return normalize(data as unknown as Record<string, unknown>)
}

export async function bulkCreateRegistroDiario(
  rows: (CreateRegistroDiarioInput & { created_by: string })[]
): Promise<RegistroDiario[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registro_diario')
    .insert(rows)
    .select(SELECT_WITH_QA)

  if (error) throw new Error(error.message)

  return (data as unknown as Record<string, unknown>[]).map(normalize)
}

export async function updateRegistroDiario(
  id: string,
  input: Partial<CreateRegistroDiarioInput>
): Promise<RegistroDiario> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('registro_diario')
    .update(input)
    .eq('id', id)
    .select(SELECT_WITH_QA)
    .single()

  if (error) throw new Error(error.message)
  return normalize(data as unknown as Record<string, unknown>)
}

export async function deleteRegistroDiario(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('registro_diario').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
