import { Badge } from '@/components/ui/badge'
import { ESTADO_QA_LABELS } from '@/lib/constants'
import type { EstadoQaEnum } from '@/types/database.types'

const estadoConfig: Record<
  EstadoQaEnum,
  { variant: 'success' | 'info' | 'warning' | 'danger' | 'slate' | 'purple' | 'secondary'; label: string }
> = {
  PEND_ASIGNACION:     { variant: 'slate',     label: ESTADO_QA_LABELS.PEND_ASIGNACION },
  EN_ESTIMACION:       { variant: 'info',      label: ESTADO_QA_LABELS.EN_ESTIMACION },
  PEND_APROB_ATI:      { variant: 'purple',    label: ESTADO_QA_LABELS.PEND_APROB_ATI },
  EN_PRUEBAS_QA:       { variant: 'secondary', label: ESTADO_QA_LABELS.EN_PRUEBAS_QA },
  OBSERVADO_BLOQUEADO: { variant: 'warning',   label: ESTADO_QA_LABELS.OBSERVADO_BLOQUEADO },
  EN_PRUEBAS_USUARIO:  { variant: 'secondary', label: ESTADO_QA_LABELS.EN_PRUEBAS_USUARIO },
  TERMINADO:           { variant: 'success',   label: ESTADO_QA_LABELS.TERMINADO },
  CANCELADO:           { variant: 'slate',     label: ESTADO_QA_LABELS.CANCELADO },
}

interface StatusBadgeProps {
  estado: EstadoQaEnum
  className?: string
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const config = estadoConfig[estado] ?? { variant: 'slate' as const, label: estado }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
