'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  X, Trash2, Save, ClipboardList, Building2, User2,
  CalendarDays, MessageSquare, LayoutGrid, UserCheck, ChevronDown, ExternalLink,
  CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateActividadAction, deleteActividadAction } from '@/server/actions/actividades'
import {
  ACTIVIDAD_PRIORIDAD_LABELS, ACTIVIDAD_PRIORIDAD_COLORS,
  ACTIVIDAD_PROGRESO_LABELS, ACTIVIDAD_PROGRESO_COLORS,
  ACTIVIDAD_ESTADO_LABELS, ACTIVIDAD_ESTADO_ORDER,
} from '@/lib/constants'
import type { Actividad, AplicativoCatalogo, Profile } from '@/types/domain.types'

function fmtTs(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

function StyledSelect({
  value, onChange, children, accent,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div className="relative">
      {accent && (
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 text-sm
          outline-none transition focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer
          ${accent ? 'pl-8' : 'pl-3'}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  )
}

function FieldLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  )
}

interface Props {
  actividad: Actividad
  open: boolean
  onOpenChange: (open: boolean) => void
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
  onUpdated: (actividad: Actividad) => void
  onDeleted: (id: string) => void
}

export function ActividadDetailDialog({
  actividad, open, onOpenChange, analistas, aplicativos, onUpdated, onDeleted,
}: Props) {
  const [estado, setEstado] = useState(actividad.estado)
  const [progreso, setProgreso] = useState(actividad.progreso)
  const [prioridad, setPrioridad] = useState(actividad.prioridad)
  const [aplicativo, setAplicativo] = useState(actividad.aplicativo ?? '')
  const [atiResponsable, setAtiResponsable] = useState(actividad.ati_responsable ?? '')
  const [qaAsignadoId, setQaAsignadoId] = useState(actividad.qa_asignado_id ?? '')
  const [fechaInicio, setFechaInicio] = useState(actividad.fecha_inicio ?? '')
  const [fechaCompromiso, setFechaCompromiso] = useState(actividad.fecha_compromiso ?? '')
  const [observaciones, setObservaciones] = useState(actividad.observaciones ?? '')
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [confirmingMove, setConfirmingMove] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleAplicativoChange(codigo: string) {
    setAplicativo(codigo)
    const ap = aplicativos.find((a) => a.codigo === codigo)
    setAtiResponsable(ap?.ati_responsable ?? '')
  }

  function handleSaveClick() {
    if (estado !== actividad.estado) {
      setConfirmingMove(true)
    } else {
      doSave()
    }
  }

  function doSave() {
    startTransition(async () => {
      const obsConMotivo = estado === 'OBSERVADO_BLOQUEADO' && motivoBloqueo.trim()
        ? `[BLOQUEO] ${motivoBloqueo.trim()}${observaciones ? '\n\n' + observaciones : ''}`
        : observaciones || undefined

      const result = await updateActividadAction(actividad.id, {
        estado,
        progreso,
        prioridad,
        aplicativo: aplicativo || undefined,
        ati_responsable: atiResponsable || undefined,
        qa_asignado_id: qaAsignadoId || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_compromiso: fechaCompromiso || undefined,
        observaciones: obsConMotivo,
      })
      if (result.success) {
        toast.success(result.message ?? 'Tarea actualizada.')
        onUpdated(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteActividadAction(actividad.id)
      if (result.success) {
        toast.success('Tarea eliminada.')
        onDeleted(actividad.id)
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const apActual = aplicativos.find((a) => a.codigo === aplicativo)
  const apNombre = apActual?.nombre
  const atiFromCatalogo = !!(apActual?.ati_responsable)
  const progresoColor = ACTIVIDAD_PROGRESO_COLORS[progreso]
  const prioridadColor = ACTIVIDAD_PRIORIDAD_COLORS[prioridad]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden [&>button:first-of-type]:hidden">

          {/* Header */}
          <div className="relative flex items-start gap-4 px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-white tracking-tight">
                  {actividad.tck}
                </span>
                {actividad.iteracion_num && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 font-medium">
                    Iteración {actividad.iteracion_num}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Creado el {fmtTs(actividad.created_at)}
                {actividad.creado_por ? ` · por ${actividad.creado_por.full_name}` : ''}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status pills row */}
          <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex-wrap relative">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${progresoColor}18`, color: progresoColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: progresoColor }} />
              {ACTIVIDAD_PROGRESO_LABELS[progreso]}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${prioridadColor}15`, color: prioridadColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: prioridadColor }} />
              {ACTIVIDAD_PRIORIDAD_LABELS[prioridad]}
            </span>
            {apNombre && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Building2 className="h-3 w-3" />
                {apNombre}
              </span>
            )}
            {actividad.requirement_id && (
              <Link
                href={`/requirements?open=${actividad.requirement_id}`}
                onClick={() => onOpenChange(false)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                title="Ver requerimiento"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver REQ
              </Link>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-5">

              {/* Columna izquierda */}
              <div className="space-y-4">
                <div>
                  <FieldLabel icon={LayoutGrid} label="Estado (progreso)" />
                  <StyledSelect value={progreso} onChange={(v) => setProgreso(v as typeof progreso)} accent={progresoColor}>
                    {Object.entries(ACTIVIDAD_PROGRESO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </StyledSelect>
                </div>

                <div>
                  <FieldLabel icon={LayoutGrid} label="Prioridad" />
                  <StyledSelect value={prioridad} onChange={(v) => setPrioridad(v as typeof prioridad)} accent={prioridadColor}>
                    {Object.entries(ACTIVIDAD_PRIORIDAD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </StyledSelect>
                </div>

                <div>
                  <FieldLabel icon={LayoutGrid} label="Depósito (columna del tablero)" />
                  <StyledSelect value={estado} onChange={(v) => setEstado(v as typeof estado)}>
                    {ACTIVIDAD_ESTADO_ORDER.map((v) => <option key={v} value={v}>{ACTIVIDAD_ESTADO_LABELS[v]}</option>)}
                  </StyledSelect>
                  {estado === 'OBSERVADO_BLOQUEADO' && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-[10px]">!</span>
                        Indica el motivo del bloqueo / observación
                      </div>
                      <textarea
                        value={motivoBloqueo}
                        onChange={(e) => setMotivoBloqueo(e.target.value)}
                        placeholder="Describe el motivo del bloqueo…"
                        rows={2}
                        className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel icon={CalendarDays} label="F. Ini. Plan." />
                    {actividad.iter_fecha_inicio ? (
                      <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {new Date(actividad.iter_fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                    )}
                  </div>
                  <div>
                    <FieldLabel icon={CalendarDays} label="F. Ent. Plan." />
                    {actividad.iter_fecha_vencimiento ? (
                      <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {new Date(actividad.iter_fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={fechaCompromiso}
                        onChange={(e) => setFechaCompromiso(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                <div>
                  <FieldLabel icon={Building2} label="Aplicativo" />
                  <StyledSelect value={aplicativo} onChange={handleAplicativoChange}>
                    <option value="">Sin asignar</option>
                    {aplicativos.map((a) => (
                      <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div>
                  <FieldLabel icon={UserCheck} label="QA Asignado" />
                  <StyledSelect value={qaAsignadoId} onChange={setQaAsignadoId}>
                    <option value="">Sin asignar</option>
                    {analistas.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </StyledSelect>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">ATI Responsable</span>
                    </div>
                    {atiFromCatalogo && (
                      <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        Desde catálogo
                      </span>
                    )}
                  </div>
                  <input
                    value={atiResponsable}
                    onChange={(e) => setAtiResponsable(e.target.value)}
                    placeholder="Nombre del responsable ATI"
                    disabled={atiFromCatalogo}
                    className={`w-full rounded-lg border py-2 px-3 text-sm outline-none transition
                      ${atiFromCatalogo
                        ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed select-none'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400'
                      }`}
                  />
                </div>

                <div>
                  <FieldLabel icon={MessageSquare} label="Notas / Observaciones" />
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Escribe notas u observaciones (opcional)"
                    rows={4}
                    className="resize-none rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

          {/* KPIs de iteración vinculada */}
          {actividad.iteration_id && (
            <div className="mx-6 mb-4 grid grid-cols-4 gap-2">
              {(() => {
                const cpTotal = actividad.iter_cp_total
                const cpOk    = actividad.iter_cp_ok
                const cpFal   = actividad.iter_cp_fallo
                const avCP    = cpTotal > 0 ? Math.min(100, Math.round(((cpOk + cpFal) / cpTotal) * 100)) : 0
                return (
                  <>
                    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <span className="text-xl font-bold text-blue-600">{avCP}%</span>
                      <span className="text-[10px] text-slate-400">Avance CP</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <span className="text-xl font-bold text-slate-700">{cpTotal}</span>
                      <span className="text-[10px] text-slate-400">CP Total</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xl font-bold text-emerald-600">{cpOk}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">CP OK</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-xl font-bold text-red-500">{cpFal}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">CP Fal.</span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5"
              onClick={() => setConfirmingDelete(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveClick} disabled={isPending} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmingMove} onOpenChange={setConfirmingMove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar columna del tablero?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{actividad.tck}</strong> pasará de{' '}
              <strong>{ACTIVIDAD_ESTADO_LABELS[actividad.estado]}</strong> a{' '}
              <strong>{ACTIVIDAD_ESTADO_LABELS[estado]}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmingMove(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmingMove(false); doSave() }}>
              Sí, guardar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{actividad.tck}</strong> del planner junto con su iteración vinculada.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { setConfirmingDelete(false); handleDelete() }}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
