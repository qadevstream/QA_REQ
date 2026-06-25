import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantStyles = {
  default: 'border-border',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  danger:  'border-red-200 bg-red-50',
  info:    'border-blue-200 bg-blue-50',
}

const iconStyles = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
}

const valueStyles = {
  default: 'text-foreground',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger:  'text-red-700',
  info:    'text-blue-700',
}

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  className,
}: KPICardProps) {
  return (
    <Card className={cn('border-2 transition-shadow hover:shadow-md', variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn('text-3xl font-bold', valueStyles[variant])}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn('rounded-xl p-3', iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
