import { createClient } from '@/lib/supabase/server'
import type { AplicativoCatalogo } from '@/types/domain.types'

export async function findAllAplicativos(soloActivos = true): Promise<AplicativoCatalogo[]> {
  const supabase = await createClient()
  let query = supabase
    .from('aplicativos_catalogo')
    .select('*')
    .order('orden', { ascending: true })
    .order('codigo', { ascending: true })

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as AplicativoCatalogo[]
}

export async function createAplicativo(
  input: Omit<AplicativoCatalogo, 'orden'> & { orden?: number }
): Promise<AplicativoCatalogo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('aplicativos_catalogo')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AplicativoCatalogo
}

export async function updateAplicativo(
  codigo: string,
  input: Partial<Omit<AplicativoCatalogo, 'codigo'>>
): Promise<AplicativoCatalogo> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('aplicativos_catalogo')
    .update(input)
    .eq('codigo', codigo)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as AplicativoCatalogo
}

export async function deleteAplicativo(codigo: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('aplicativos_catalogo')
    .delete()
    .eq('codigo', codigo)
  if (error) throw new Error(error.message)
}
