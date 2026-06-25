import { createClient } from '@/lib/supabase/server'
import type { ActividadEstadoHistorial } from '@/types/domain.types'

export async function findAllActividadEstadoHistorial(
  limit = 200
): Promise<ActividadEstadoHistorial[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actividad_estado_historial')
    .select(`
      *,
      actividad:actividades!actividad_estado_historial_actividad_id_fkey(tck),
      changed_by_profile:profiles!actividad_estado_historial_changed_by_fkey(id, full_name, role)
    `)
    .order('changed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return data as unknown as ActividadEstadoHistorial[]
}
