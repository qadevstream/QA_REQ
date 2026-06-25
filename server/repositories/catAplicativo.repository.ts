import { createClient } from '@/lib/supabase/server'
import type { CatAplicativo } from '@/types/domain.types'

export async function findAllCatAplicativos(soloActivos = true): Promise<CatAplicativo[]> {
  const supabase = await createClient()
  let query = supabase
    .from('cat_aplicativo')
    .select('*')
    .order('orden', { ascending: true })
    .order('aplicativo', { ascending: true })

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as CatAplicativo[]
}

export async function createCatAplicativo(
  input: Omit<CatAplicativo, 'orden'> & { orden?: number }
): Promise<CatAplicativo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_aplicativo')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatAplicativo
}

export async function updateCatAplicativo(
  aplicativo: string,
  input: Partial<Omit<CatAplicativo, 'aplicativo'>>
): Promise<CatAplicativo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cat_aplicativo')
    .update(input)
    .eq('aplicativo', aplicativo)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as CatAplicativo
}

export async function deleteCatAplicativo(aplicativo: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cat_aplicativo')
    .delete()
    .eq('aplicativo', aplicativo)
  if (error) throw new Error(error.message)
}
