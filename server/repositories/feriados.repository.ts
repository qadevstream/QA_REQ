import { createClient } from '@/lib/supabase/server'
import type { CatFeriado } from '@/types/domain.types'

export async function findAllFeriados(soloActivos = true): Promise<CatFeriado[]> {
  const supabase = await createClient()
  let query = supabase
    .from('cat_feriados')
    .select('*')
    .order('fecha', { ascending: true })

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as CatFeriado[]
}

export async function createFeriado(input: CatFeriado): Promise<CatFeriado> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_feriados')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatFeriado
}

export async function updateFeriado(
  fecha: string,
  input: Partial<Omit<CatFeriado, 'fecha'>>
): Promise<CatFeriado> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_feriados')
    .update(input)
    .eq('fecha', fecha)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatFeriado
}

export async function deleteFeriado(fecha: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cat_feriados')
    .delete()
    .eq('fecha', fecha)
  if (error) throw new Error(error.message)
}
