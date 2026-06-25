import { createClient } from '@/lib/supabase/server'
import type { RequirementHistory } from '@/types/domain.types'

export async function findHistoryByRequirement(
  requirementId: string
): Promise<RequirementHistory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requirement_history')
    .select(`
      *,
      changed_by_profile:profiles!requirement_history_changed_by_fkey(id, full_name, role)
    `)
    .eq('requirement_id', requirementId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data as unknown as RequirementHistory[]
}

export async function findAllHistory(limit = 100): Promise<RequirementHistory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('requirement_history')
    .select(`
      *,
      changed_by_profile:profiles!requirement_history_changed_by_fkey(id, full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return data as unknown as RequirementHistory[]
}
