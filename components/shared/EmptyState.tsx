import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'Sin resultados',
  description = 'No se encontraron registros con los filtros aplicados.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="mb-4 rounded-full bg-muted p-4">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  )
}
