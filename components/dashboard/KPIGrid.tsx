import { Activity, CheckCircle2, ShieldAlert, Clock } from 'lucide-react'
import { KPICard } from './KPICard'
import type { DashboardMetrics } from '@/types/domain.types'

interface KPIGridProps {
  metrics: DashboardMetrics
}

export function KPIGrid({ metrics }: KPIGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Requerimientos Activos"
        value={metrics.total_activos}
        icon={Activity}
        variant="info"
        description="En progreso actualmente"
      />
      <KPICard
        title="Completados"
        value={metrics.total_completados}
        icon={CheckCircle2}
        variant="success"
        description="Finalizados exitosamente"
      />
      <KPICard
        title="Bloqueados"
        value={metrics.total_bloqueados}
        icon={ShieldAlert}
        variant={metrics.total_bloqueados > 0 ? 'danger' : 'default'}
        description="Requieren atención inmediata"
      />
      <KPICard
        title="Vencidos"
        value={metrics.total_vencidos}
        icon={Clock}
        variant={metrics.total_vencidos > 0 ? 'warning' : 'default'}
        description="Fecha compromiso superada"
      />
    </div>
  )
}
