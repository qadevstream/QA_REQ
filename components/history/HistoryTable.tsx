import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { CAMPO_MODIFICADO_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { History } from 'lucide-react'
import type { RequirementHistory } from '@/types/domain.types'

interface HistoryTableProps {
  history: RequirementHistory[]
  showRequirementLink?: boolean
}

export function HistoryTable({ history, showRequirementLink = false }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Sin registros de auditoría"
        description="No hay cambios registrados en el sistema."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Usuario</TableHead>
          {showRequirementLink && <TableHead>Requerimiento</TableHead>}
          <TableHead>Campo</TableHead>
          <TableHead>Valor Anterior</TableHead>
          <TableHead>Valor Nuevo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDateTime(entry.created_at)}
            </TableCell>
            <TableCell className="text-sm font-medium">
              {entry.changed_by_profile?.full_name ?? '—'}
            </TableCell>
            {showRequirementLink && (
              <TableCell>
                <Link
                  href={`/requirements/${entry.requirement_id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Ver req.
                </Link>
              </TableCell>
            )}
            <TableCell className="text-sm">
              {CAMPO_MODIFICADO_LABELS[entry.campo_modificado] ?? entry.campo_modificado}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              <span className="line-through">
                {entry.valor_anterior || '(vacío)'}
              </span>
            </TableCell>
            <TableCell className="text-sm text-foreground font-medium">
              {entry.valor_nuevo || '(vacío)'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
