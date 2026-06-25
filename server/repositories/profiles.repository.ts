import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/domain.types'

export async function findAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name')

  if (error) throw new Error(error.message)
  return data as Profile[]
}

export async function findProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return data as Profile
}

export async function findAnalistas(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['SUPERVISOR', 'ANALISTA_QA'])
    .eq('is_active', true)
    .order('full_name')

  if (error) throw new Error(error.message)
  return data as Profile[]
}
