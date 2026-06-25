import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ACTIVIDAD_ESTADO_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { ArrowRight, History } from 'lucide-react'
import type { ActividadEstadoHistorial, ActividadEstadoEnum } from '@/types/domain.types'

const ESTADO_COLORS: Record<ActividadEstadoEnum, string> = {
  PEND_ASIGNACION:      'bg-slate-100 text-slate-700',
  EN_ESTIMACION:        'bg-blue-100 text-blue-700',
  PEND_APROB_ATI:       'bg-yellow-100 text-yellow-700',
  EN_PRUEBAS_QA:        'bg-violet-100 text-violet-700',
  OBSERVADO_BLOQUEADO:  'bg-red-100 text-red-700',
  EN_PRUEBAS_USUARIO:   'bg-cyan-100 text-cyan-700',
  TERMINADO:            'bg-green-100 text-green-700',
}

function EstadoBadge({ estado }: { estado: ActividadEstadoEnum | null }) {
  if (!estado) return <span className="text-muted-foreground text-xs italic">—</span>
  return (
    <Badge className={`text-xs font-medium border-0 ${ESTADO_COLORS[estado]}`}>
      {ACTIVIDAD_ESTADO_LABELS[estado]}
    </Badge>
  )
}

interface Props {
  historial: ActividadEstadoHistorial[]
}

export function ActividadHistorialTable({ historial }: Props) {
  if (historial.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Sin registros de cambios"
        description="No hay cambios de estado registrados en el Planner."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Ticket (TCK)</TableHead>
          <TableHead>Estado anterior</TableHead>
          <TableHead className="w-6" />
          <TableHead>Estado nuevo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historial.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDateTime(entry.changed_at)}
            </TableCell>
            <TableCell className="text-sm font-medium">
              {entry.changed_by_profile?.full_name ?? '—'}
            </TableCell>
            <TableCell className="text-sm font-mono">
              {entry.actividad?.tck ?? entry.actividad_id.slice(0, 8)}
            </TableCell>
            <TableCell>
              <EstadoBadge estado={entry.estado_anterior} />
            </TableCell>
            <TableCell>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </TableCell>
            <TableCell>
              <EstadoBadge estado={entry.estado_nuevo} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
