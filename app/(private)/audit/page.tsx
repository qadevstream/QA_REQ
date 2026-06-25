import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { HistoryTable } from '@/components/history/HistoryTable'
import { ActividadHistorialTable } from '@/components/history/ActividadHistorialTable'
import { findAllHistory } from '@/server/repositories/history.repository'
import { findAllActividadEstadoHistorial } from '@/server/repositories/actividadEstadoHistorial.repository'
import { getCurrentUser } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Auditoría Global' }

export default async function AuditPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') redirect('/requirements')

  const [history, actividadHistorial] = await Promise.all([
    findAllHistory(200),
    findAllActividadEstadoHistorial(200),
  ])

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría Global</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro completo de cambios en el sistema.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Historial de Requerimientos</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Últimos {history.length} cambios en campos de requerimientos.
          </p>
        </div>
        <Card className="overflow-hidden">
          <HistoryTable history={history} showRequirementLink />
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Historial de Cambios de Estado — Planner</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Últimos {actividadHistorial.length} movimientos de columna en el tablero de actividades.
          </p>
        </div>
        <Card className="overflow-hidden">
          <ActividadHistorialTable historial={actividadHistorial} />
        </Card>
      </section>
    </div>
  )
}
