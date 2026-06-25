'use client'

import { Megaphone, AlertTriangle, ArrowDown, Circle, CircleDot, CheckCircle2, Calendar } from 'lucide-react'
import {
  ACTIVIDAD_PRIORIDAD_COLORS,
  ACTIVIDAD_PROGRESO_COLORS,
} from '@/lib/constants'
import { apColor, apLabelShort } from '@/lib/aplicativos'
import { formatDate } from '@/lib/utils'
import type { Actividad, AplicativoCatalogo } from '@/types/domain.types'

const PRIORIDAD_ICON = {
  URGENTE: Megaphone,
  IMPORTANTE: AlertTriangle,
  MEDIA: Circle,
  BAJA: ArrowDown,
} as const

const PROGRESO_ICON = {
  NO_INICIADO: Circle,
  EN_CURSO: CircleDot,
  COMPLETADO: CheckCircle2,
} as const

interface ActividadCardProps {
  actividad: Actividad
  aplicativos: AplicativoCatalogo[]
  onDragStart: (e: React.DragEvent, id: string) => void
  onClick?: () => void
}

export function ActividadCard({ actividad, aplicativos, onDragStart, onClick }: ActividadCardProps) {
  const PrioridadIcon = PRIORIDAD_ICON[actividad.prioridad]
  const ProgresoIcon = PROGRESO_ICON[actividad.progreso]
  const initials = actividad.qa_asignado?.full_name
    ?.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, actividad.id)}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-2"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        {actividad.aplicativo && (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: apColor(actividad.aplicativo, aplicativos) }}
          >
            {apLabelShort(actividad.aplicativo, aplicativos)}
          </span>
        )}
        {actividad.iteracion_num != null && (
          <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Interacción {actividad.iteracion_num}
          </span>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
        <p className="text-sm font-semibold text-slate-900 leading-snug">{actividad.tck}</p>
      </div>

      <div className="space-y-0.5 pl-5 text-xs text-slate-500">
        {actividad.ati_responsable && <p>ATI_Responsable: {actividad.ati_responsable}</p>}
        <p>QA_Asignado: {actividad.qa_asignado?.full_name ?? '—'}</p>
        {actividad.fecha_compromiso && <p>Fecha_Compromiso: {formatDate(actividad.fecha_compromiso)}</p>}
        {typeof actividad.dias_en_estado === 'number' && (
          <p>Días_en_Estado: {actividad.dias_en_estado} día{actividad.dias_en_estado !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <PrioridadIcon className="h-3.5 w-3.5" style={{ color: ACTIVIDAD_PRIORIDAD_COLORS[actividad.prioridad] }} />
          <ProgresoIcon className="h-3.5 w-3.5" style={{ color: ACTIVIDAD_PROGRESO_COLORS[actividad.progreso] }} />
          {actividad.fecha_compromiso && (
            <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              <Calendar className="h-3 w-3" />
              {new Date(actividad.fecha_compromiso + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric' })}
            </span>
          )}
        </div>
        {actividad.qa_asignado && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0184EF]/20 text-[10px] font-bold text-[#0184EF]">
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}
