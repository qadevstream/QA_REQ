'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, BellRing, AlertCircle, Circle, ArrowDown } from 'lucide-react'
import { ACTIVIDAD_PRIORIDAD_LABELS, ACTIVIDAD_PRIORIDAD_COLORS } from '@/lib/constants'
import type { ActividadPrioridadEnum } from '@/types/domain.types'

const PRIORIDADES: ActividadPrioridadEnum[] = ['URGENTE', 'IMPORTANTE', 'MEDIA', 'BAJA']

function PrioIcon({ p, size = 12 }: { p: ActividadPrioridadEnum; size?: number }) {
  const color = ACTIVIDAD_PRIORIDAD_COLORS[p]
  const cls = 'shrink-0'
  if (p === 'URGENTE')    return <BellRing    size={size} className={cls} style={{ color }} />
  if (p === 'IMPORTANTE') return <AlertCircle size={size} className={cls} style={{ color }} />
  if (p === 'MEDIA')      return <Circle      size={size} className={cls} style={{ color }} fill={color} />
  return                         <ArrowDown   size={size} className={cls} style={{ color }} />
}

export function PrioridadIcon({ value, size = 12 }: { value: ActividadPrioridadEnum; size?: number }) {
  return <PrioIcon p={value} size={size} />
}

interface Props {
  value: ActividadPrioridadEnum
  onChange: (v: ActividadPrioridadEnum) => void
  compact?: boolean
}

export function PrioridadSelect({ value, onChange, compact = false }: Props) {
  const triggerCls = compact
    ? 'flex w-full items-center gap-1.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 cursor-pointer'
    : 'flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'

  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onChange(v as ActividadPrioridadEnum)}>
      <SelectPrimitive.Trigger className={triggerCls}>
        {/* Icono se actualiza vía prop value de React */}
        <PrioIcon p={value} size={compact ? 11 : 13} />
        {/* SelectValue lee del contexto Radix — se actualiza solo al seleccionar */}
        <SelectPrimitive.Value className="flex-1 text-left" />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className={compact ? 'h-3 w-3 opacity-40 shrink-0 ml-auto' : 'h-4 w-4 opacity-50 shrink-0 ml-auto'} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[170px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <SelectPrimitive.Viewport className="p-1">
            {PRIORIDADES.map((p) => (
              <SelectPrimitive.Item
                key={p}
                value={p}
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <span className="flex items-center gap-2">
                  <PrioIcon p={p} size={13} />
                  {/* ItemText es lo que SelectValue captura para el trigger */}
                  <SelectPrimitive.ItemText>
                    {ACTIVIDAD_PRIORIDAD_LABELS[p]}
                  </SelectPrimitive.ItemText>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
