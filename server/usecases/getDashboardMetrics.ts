import { createClient } from '@/lib/supabase/server'
import type { DashboardMetrics } from '@/types/domain.types'
import { isVencido } from '@/lib/utils'

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: all, error } = await (supabase as any)
    .from('requirement_iterations')
    .select(`
      id, estado_qa, fecha_entrega_planificada,
      requirement:requirements!requirement_iterations_requirement_id_fkey(
        aplicativo,
        responsable_qa:profiles!requirements_responsable_qa_id_fkey(id, full_name)
      )
    `)

  if (error) throw new Error(error.message)

  const iterations = (all ?? [] as any[]).map((r: any) => {
    const req = Array.isArray(r.requirement) ? r.requirement[0] : r.requirement
    return {
      estado_qa: r.estado_qa as string,
      fecha_entrega_planificada: r.fecha_entrega_planificada as string | null,
      aplicativo: (req as any)?.aplicativo as string ?? '',
      responsable_qa: Array.isArray((req as any)?.responsable_qa)
        ? (req as any).responsable_qa[0] ?? null
        : (req as any)?.responsable_qa ?? null,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total_completados = iterations.filter((r: any) => r.estado_qa === 'TERMINADO').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total_bloqueados  = iterations.filter((r: any) => r.estado_qa === 'OBSERVADO_BLOQUEADO').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total_vencidos    = iterations.filter((r: any) => isVencido(r.fecha_entrega_planificada, r.estado_qa)).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total_activos     = iterations.filter((r: any) => r.estado_qa !== 'TERMINADO' && r.estado_qa !== 'CANCELADO').length

  const estadoMap = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iterations.forEach((r: any) => estadoMap.set(r.estado_qa, (estadoMap.get(r.estado_qa) ?? 0) + 1))
  const by_estado = Array.from(estadoMap.entries()).map(([estado, count]) => ({
    estado: estado as DashboardMetrics['by_estado'][0]['estado'], count,
  }))

  const qaMap = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iterations.forEach((r: any) => {
    const name = (r.responsable_qa as any)?.full_name ?? 'Sin asignar'
    qaMap.set(name, (qaMap.get(name) ?? 0) + 1)
  })
  const by_qa = Array.from(qaMap.entries())
    .map(([qa_name, count]) => ({ qa_name, count }))
    .sort((a, b) => b.count - a.count)

  const appMap = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iterations.forEach((r: any) => {
    if (r.aplicativo) appMap.set(r.aplicativo, (appMap.get(r.aplicativo) ?? 0) + 1)
  })
  const by_aplicativo = Array.from(appMap.entries()).map(([aplicativo, count]) => ({
    aplicativo: aplicativo as string, count,
  }))

  return { total_activos, total_completados, total_bloqueados, total_vencidos, by_estado, by_qa, by_aplicativo }
}
