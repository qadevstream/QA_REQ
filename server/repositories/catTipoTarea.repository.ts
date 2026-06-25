import { createClient } from '@/lib/supabase/server'
import type { CatTipoTarea } from '@/types/domain.types'

export async function findAllCatTipoTareas(soloActivos = true): Promise<CatTipoTarea[]> {
  const supabase = await createClient()
  let query = supabase
    .from('cat_tipo_tarea')
    .select('*')
    .order('orden', { ascending: true })
    .order('tipo_tarea', { ascending: true })

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as CatTipoTarea[]
}

export async function createCatTipoTarea(
  input: Omit<CatTipoTarea, 'orden'> & { orden?: number }
): Promise<CatTipoTarea> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_tipo_tarea')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatTipoTarea
}

export async function updateCatTipoTarea(
  tipo_tarea: string,
  input: Partial<Omit<CatTipoTarea, 'tipo_tarea'>>
): Promise<CatTipoTarea> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_tipo_tarea')
    .update(input)
    .eq('tipo_tarea', tipo_tarea)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatTipoTarea
}

export async function deleteCatTipoTarea(tipo_tarea: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cat_tipo_tarea')
    .delete()
    .eq('tipo_tarea', tipo_tarea)
  if (error) throw new Error(error.message)
}
