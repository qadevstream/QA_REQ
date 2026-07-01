'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Plus, Save, X, Building2, User, FolderOpen,
  Clock, CheckCircle2, AlertTriangle, Bug, Link2, PenLine,
  CalendarDays, BarChart2, ClipboardList, ChevronDown,
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PrioridadSelect } from '@/components/shared/PrioridadSelect'
import { apLabelShort } from '@/lib/aplicativos'
import { TIPO_REQUERIMIENTO_LABELS, ESTADO_QA_LABELS, ESTADO_QA_ORDER } from '@/lib/constants'
import { addIterationAction, updateIterationAction } from '@/server/actions/requirements'
import type { Requirement, RequirementIteration, AplicativoCatalogo, Profile } from '@/types/domain.types'
import type { EstadoQaEnum } from '@/types/database.types'

const FASES_STEPPER: { key: EstadoQaEnum; label: string }[] = [
  { key: 'PEND_ASIGNACION',        label: 'Pend. Asignación' },
  { key: 'EN_ESTIMACION',          label: 'Estimación' },
  { key: 'PEND_APROB_ATI',         label: 'Aprob. ATI' },
  { key: 'EN_PRUEBAS_QA',          label: 'Pruebas QA' },
  { key: 'TERMINADO',              label: 'Terminado QA' },
  { key: 'EN_PRUEBAS_USUARIO',     label: 'Pruebas UAT' },
  { key: 'PEND_IMPLEMENTACION_PRD', label: 'Pend. Impl. PRD' },
  { key: 'IMPLEMENTADO_PRD',       label: 'Implementado PRD' },
]

interface Props {
  requirement: Requirement
  aplicativos: AplicativoCatalogo[]
  analistas: Profile[]
  canEdit: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (req: Requirement) => void
}

type IterForm = {
  estado_qa: string
  estado_req: string
  avance_porcentaje: number
  prioridad: string
  cp_total: number
  cp_ok: number
  cp_fallo: number
  horas_estimadas: number
  horas_reales: number
  fecha_asignacion: string
  fecha_entrega_estimacion: string
  fecha_aprobacion_estimacion: string
  fecha_inicio_planificada: string
  fecha_inicio_real: string
  fecha_entrega_planificada: string
  fecha_entrega_real: string
  defectos_qa: number
  defectos_uat: number
  defectos_produccion: number
  rutas_evidencias: string
  observaciones_estado: string
}

function toForm(it: RequirementIteration): IterForm {
  return {
    estado_qa: it.estado_qa,
    estado_req: it.estado_req ?? '',
    avance_porcentaje: it.avance_porcentaje,
    prioridad: it.prioridad,
    cp_total: it.cp_total ?? 0,
    cp_ok: it.cp_ok,
    cp_fallo: it.cp_fallo,
    horas_estimadas: it.horas_estimadas,
    horas_reales: it.horas_reales,
    fecha_asignacion: it.fecha_asignacion ?? '',
    fecha_entrega_estimacion: it.fecha_entrega_estimacion ?? '',
    fecha_aprobacion_estimacion: it.fecha_aprobacion_estimacion ?? '',
    fecha_inicio_planificada: it.fecha_inicio_planificada ?? '',
    fecha_inicio_real: it.fecha_inicio_real ?? '',
    fecha_entrega_planificada: it.fecha_entrega_planificada ?? '',
    fecha_entrega_real: it.fecha_entrega_real ?? '',
    defectos_qa: it.defectos_qa,
    defectos_uat: it.defectos_uat,
    defectos_produccion: it.defectos_produccion,
    rutas_evidencias: it.rutas_evidencias ?? '',
    observaciones_estado: it.observaciones_estado ?? '',
  }
}

const IC = 'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500'
const IC_NUM = `${IC} text-center`

function fmtDateES(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

function fmtTimeHM(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

function CircularProgress({ value, color = '#3b82f6' }: { value: number; color?: string }) {
  const r = 27
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0">
      <circle cx="34" cy="34" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 34 34)" />
      <text x="34" y="39" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">{value}%</text>
    </svg>
  )
}


function CollapsibleSection({ icon: Icon, label, children, defaultOpen = true }: {
  icon: React.ElementType; label: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 group"
      >
        <Icon className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex-1 text-left">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

export function RequirementDetailDialog({
  requirement, aplicativos, analistas: _analistas,
  canEdit, open, onOpenChange, onUpdated,
}: Props) {
  const iters = requirement.iterations ?? []
  const [activeIdx, setActiveIdx] = useState(iters.length > 0 ? iters.length - 1 : 0)
  const [localIters, setLocalIters] = useState<RequirementIteration[]>(iters)
  const [form, setForm] = useState<IterForm | null>(localIters[activeIdx] ? toForm(localIters[activeIdx]) : null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, startSave] = useTransition()
  const [isAdding, startAdd] = useTransition()

  const activeIter = localIters[activeIdx]
  const currentEstadoQa = form?.estado_qa ?? activeIter?.estado_qa
  const isBlocked   = currentEstadoQa === 'OBSERVADO_BLOQUEADO'
  const isCancelled = currentEstadoQa === 'CANCELADO'
  const rawFaseIdx  = FASES_STEPPER.findIndex(f => f.key === currentEstadoQa)
  // OBSERVADO_BLOQUEADO no está en el stepper — mostrar hasta EN_PRUEBAS_QA (idx 3) como completado
  const faseIdx = rawFaseIdx >= 0 ? rawFaseIdx : isBlocked ? 3 : -1
  const cpEjecutados = form ? form.cp_ok + form.cp_fallo : 0
  const avanceCalc = form && form.cp_total > 0
    ? Math.min(100, Math.round((cpEjecutados / form.cp_total) * 100))
    : 0
  const avanceHorasCalc = form && form.horas_estimadas > 0
    ? Math.min(100, Math.round((form.horas_reales / form.horas_estimadas) * 100))
    : 0

  function selectIter(idx: number) {
    setActiveIdx(idx)
    setForm(localIters[idx] ? toForm(localIters[idx]) : null)
    setIsDirty(false)
  }

  function setField<K extends keyof IterForm>(key: K, value: IterForm[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
    setIsDirty(true)
  }

  function handleAddIter() {
    startAdd(async () => {
      const result = await addIterationAction(requirement.id)
      if (result.success) {
        const newIter = result.data
        const updated = [...localIters, newIter]
        setLocalIters(updated)
        setActiveIdx(updated.length - 1)
        setForm(toForm(newIter))
        setIsDirty(false)
        onUpdated({ ...requirement, iterations: updated })
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleSave() {
    if (!form || !activeIter) return
    startSave(async () => {
      const result = await updateIterationAction(activeIter.id, {
        estado_qa: form.estado_qa as EstadoQaEnum,
        estado_req: form.estado_req || undefined,
        avance_porcentaje: avanceCalc,
        prioridad: form.prioridad as any,
        cp_total: form.cp_total,
        cp_ok: form.cp_ok,
        cp_fallo: form.cp_fallo,
        horas_estimadas: form.horas_estimadas,
        // horas_reales NO se envía: se calcula automáticamente desde la Bitácora vía trigger
        fecha_asignacion: form.fecha_asignacion || undefined,
        fecha_entrega_estimacion: form.fecha_entrega_estimacion || undefined,
        fecha_aprobacion_estimacion: form.fecha_aprobacion_estimacion || undefined,
        fecha_inicio_planificada: form.fecha_inicio_planificada || undefined,
        fecha_inicio_real: form.fecha_inicio_real || undefined,
        fecha_entrega_planificada: form.fecha_entrega_planificada || undefined,
        fecha_entrega_real: form.fecha_entrega_real || undefined,
        defectos_qa: form.defectos_qa,
        defectos_uat: form.defectos_uat,
        defectos_produccion: form.defectos_produccion,
        rutas_evidencias: form.rutas_evidencias || undefined,
        observaciones_estado: form.observaciones_estado || undefined,
      })
      if (result.success) {
        const updated = localIters.map((it, i) => i === activeIdx ? result.data : it)
        setLocalIters(updated)
        setIsDirty(false)
        onUpdated({ ...requirement, iterations: updated })
        toast.success('Iteración guardada.')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleCancel() {
    if (isDirty) {
      setForm(activeIter ? toForm(activeIter) : null)
      setIsDirty(false)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Hide default shadcn close button — we use our own */}
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col [&>button:first-of-type]:hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold text-blue-600">#{requirement.codigo_requerimiento}</span>
                <span className="text-slate-300 text-xl">|</span>
                <span className="text-xl font-bold text-slate-800">{requirement.titulo || 'Sin título'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Creado el {fmtDateES(requirement.created_at)}
                {' • '}
                Última actualización:{' '}
                {isToday(requirement.updated_at)
                  ? `hoy ${fmtTimeHM(requirement.updated_at)}`
                  : fmtDateES(requirement.updated_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Info bar (4 cards) ── */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { icon: Building2, label: 'Aplicativo',      value: apLabelShort(requirement.aplicativo, aplicativos) || requirement.aplicativo },
            { icon: User,      label: 'ATI Responsable', value: requirement.ati_responsable || '—' },
            { icon: FolderOpen,label: 'Tipo',            value: requirement.tipo_requerimiento ? TIPO_REQUERIMIENTO_LABELS[requirement.tipo_requerimiento] : '—' },
            { icon: User,      label: 'QA Responsable',  value: requirement.responsable_qa?.full_name ?? '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 px-4 py-3 bg-white">
              <Icon className="h-4 w-4 text-slate-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── Iteraciones + Fase stepper ── */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Circles — kept exactly as before */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-medium">Interacciones:</span>
              {localIters.map((it, idx) => (
                <button
                  key={it.id}
                  onClick={() => selectIter(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all
                    ${activeIdx === idx
                      ? 'bg-blue-600 text-white shadow-md scale-110'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  {it.iteracion}
                </button>
              ))}
              {canEdit && (
                <button
                  onClick={handleAddIter}
                  disabled={isAdding}
                  className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Nueva Interacción
                </button>
              )}
            </div>

            {/* Phase stepper */}
            {activeIter && form && (
              <div className="flex-1 flex items-start pt-1">
                {FASES_STEPPER.map((fase, i) => {
                  const isPast    = i < faseIdx
                  const isCurrent = i === faseIdx
                  const fechaMap: Partial<Record<typeof FASES_STEPPER[number]['key'], string>> = {
                    PEND_ASIGNACION:    form.fecha_asignacion,
                    EN_ESTIMACION:      form.fecha_entrega_estimacion,
                    PEND_APROB_ATI:     form.fecha_aprobacion_estimacion,
                    EN_PRUEBAS_QA:      form.fecha_inicio_real,
                    EN_PRUEBAS_USUARIO: form.fecha_entrega_planificada,
                    TERMINADO:          form.fecha_entrega_real,
                  }
                  const fechaRaw = fechaMap[fase.key]
                  const fechaFmt = fechaRaw
                    ? new Date(fechaRaw + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                    : null

                  return (
                    <div key={fase.key} className="flex-1 flex flex-col items-center gap-1 relative">
                      {/* línea izquierda */}
                      {i > 0 && (
                        <div className={`absolute left-0 top-[14px] w-1/2 h-0.5 ${isPast || isCurrent ? 'bg-blue-400' : 'bg-slate-200'}`} />
                      )}
                      {/* línea derecha */}
                      {i < FASES_STEPPER.length - 1 && (
                        <div className={`absolute right-0 top-[14px] w-1/2 h-0.5 ${isPast ? 'bg-blue-400' : 'bg-slate-200'}`} />
                      )}
                      {/* círculo */}
                      <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center transition-all
                        ${isPast
                          ? 'bg-emerald-500 border-2 border-emerald-500'
                          : isCurrent
                            ? 'bg-white border-2 border-blue-500 shadow shadow-blue-100'
                            : 'bg-white border-2 border-slate-300'}`}>
                        {isPast ? (
                          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : isCurrent ? (
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        ) : null}
                      </div>
                      <span className={`text-[10px] text-center leading-tight whitespace-nowrap mt-0.5
                        ${isCurrent ? 'font-bold text-blue-600' : isPast ? 'font-medium text-slate-600' : 'text-slate-400'}`}>
                        {fase.label}
                      </span>
                      <span className={`text-[9px] text-center whitespace-nowrap
                        ${isCurrent ? 'text-blue-500 font-medium' : isPast ? 'text-slate-400' : 'text-slate-300'}`}>
                        {fechaFmt ?? ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Banner bloqueo / cancelado */}
          {(isBlocked || isCancelled) && (
            <div className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium
              ${isBlocked
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
              <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-xs
                ${isBlocked ? 'bg-red-500' : 'bg-slate-400'}`}>
                {isBlocked ? '!' : '✕'}
              </span>
              {isBlocked
                ? <span><strong>Bloqueado / Observado</strong> — documenta el motivo en el campo Observaciones dentro de "Evidencias y Observaciones".</span>
                : <span><strong>Cancelado</strong> — este requerimiento fue cancelado.</span>
              }
            </div>
          )}

          {/* ── KPI cards ── */}
          {form && activeIter && (
            <>
              <div className="grid grid-cols-7 gap-3">
                {/* Avance CP */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <CircularProgress value={avanceCalc} color="#3b82f6" />
                  <p className="text-[10px] text-slate-400">Avance<br/>CP</p>
                </div>
                {/* Avance Hrs */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <CircularProgress value={avanceHorasCalc} color="#f97316" />
                  <p className="text-[10px] text-slate-400">Avance<br/>Hrs</p>
                </div>
                {/* CP Total */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-none">{form.cp_total}</p>
                    <p className="text-[10px] text-slate-400 mt-1">CP Total</p>
                  </div>
                </div>
                {/* CP OK */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-none">{form.cp_ok}</p>
                    <p className="text-[10px] text-slate-400 mt-1">CP OK</p>
                  </div>
                </div>
                {/* CP Fallidos */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-none">{form.cp_fallo}</p>
                    <p className="text-[10px] text-slate-400 mt-1">CP Fal.</p>
                  </div>
                </div>
                {/* Horas Est. */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-none">{form.horas_estimadas}</p>
                    <p className="text-[10px] text-slate-400 mt-1">H. Est.</p>
                  </div>
                </div>
                {/* Horas Real */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Clock className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700 leading-none">{form.horas_reales}</p>
                    <p className="text-[10px] text-slate-400 mt-1">H. Real</p>
                  </div>
                </div>
              </div>

              {/* ── Two-column form ── */}
              <div className="grid grid-cols-2 gap-5">

                {/* LEFT — Información General + Fechas */}
                <div className="space-y-5">

                  <CollapsibleSection icon={ClipboardList} label="Información General" defaultOpen={true}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Estado QA</label>
                          <select value={form.estado_qa} onChange={e => setField('estado_qa', e.target.value)} className={IC} disabled={!canEdit}>
                            {ESTADO_QA_ORDER.map(v => <option key={v} value={v}>{ESTADO_QA_LABELS[v]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Estado Req.</label>
                          <input value={form.estado_req} onChange={e => setField('estado_req', e.target.value)} placeholder="Comentario…" className={IC} disabled={!canEdit} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Prioridad</label>
                        <PrioridadSelect
                          value={form.prioridad as any}
                          onChange={v => { setField('prioridad', v); setIsDirty(true) }}
                        />
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection icon={CalendarDays} label="Fechas" defaultOpen={false}>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ['fecha_asignacion',         'F. Asignación'],
                          ['fecha_entrega_estimacion', 'F. Ent. Est.'],
                          ['fecha_aprobacion_estimacion','F. Apr. Est.'],
                        ] as [keyof IterForm, string][]).map(([key, label]) => (
                          <div key={key}>
                            <label className="text-xs text-slate-400">{label}</label>
                            <input type="date" value={form[key] as string}
                              onChange={e => setField(key, e.target.value)}
                              className={`${IC} text-xs`} disabled={!canEdit} />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['fecha_inicio_planificada', 'F. Ini. Plan.'],
                          ['fecha_inicio_real',        'F. Ini. Real'],
                        ] as [keyof IterForm, string][]).map(([key, label]) => (
                          <div key={key}>
                            <label className="text-xs text-slate-400">{label}</label>
                            <input type="date" value={form[key] as string}
                              onChange={e => setField(key, e.target.value)}
                              className={`${IC} text-xs`} disabled={!canEdit} />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          ['fecha_entrega_planificada', 'F. Ent. Plan.'],
                          ['fecha_entrega_real',        'F. Ent. Real'],
                        ] as [keyof IterForm, string][]).map(([key, label]) => (
                          <div key={key}>
                            <label className="text-xs text-slate-400">{label}</label>
                            <input type="date" value={form[key] as string}
                              onChange={e => setField(key, e.target.value)}
                              className={`${IC} text-xs`} disabled={!canEdit} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>

                {/* RIGHT — Métricas + Defectos + Evidencias */}
                <div className="space-y-5">

                  <CollapsibleSection icon={BarChart2} label="Métricas QA">
                    <div className="space-y-3">
                      {/* CP row */}
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-slate-400">CP Total</label>
                          <input type="number" min={0} value={form.cp_total}
                            onChange={e => setField('cp_total', Number(e.target.value) as any)}
                            className={IC_NUM} disabled={!canEdit} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">CP Ejec.</label>
                          <input type="number" value={cpEjecutados} readOnly
                            className="w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-center text-slate-400 cursor-default" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">CP OK</label>
                          <input type="number" min={0} value={form.cp_ok}
                            onChange={e => setField('cp_ok', Number(e.target.value) as any)}
                            className={IC_NUM} disabled={!canEdit} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">CP Fal.</label>
                          <input type="number" min={0} value={form.cp_fallo}
                            onChange={e => setField('cp_fallo', Number(e.target.value) as any)}
                            className={IC_NUM} disabled={!canEdit} />
                        </div>
                      </div>
                      {/* Horas row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-400">H. Est.</label>
                          <div className="relative">
                            <input type="number" min={0} value={form.horas_estimadas}
                              onChange={e => setField('horas_estimadas', Number(e.target.value) as any)}
                              className={`${IC_NUM} pr-7`} disabled={!canEdit} />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">h</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">H. Real</label>
                          <div className="relative">
                            <input type="number" value={form.horas_reales} readOnly
                              title="Se suma automáticamente desde la Bitácora de Actividades (Nro. Ticket = código del req + iteración)"
                              className="w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 pr-7 text-sm text-center text-slate-400 cursor-default" />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">h</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Avance Hrs %</label>
                          <input type="number" value={avanceHorasCalc} readOnly
                            className="w-full rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-center text-slate-400 cursor-default" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection icon={Bug} label="Defectos Registrados" defaultOpen={false}>
                    <div className="flex gap-2">
                      {([
                        ['defectos_qa',          'Def. QA',    'bg-red-50 border-red-100'],
                        ['defectos_uat',         'Def. UAT',   'bg-orange-50 border-orange-100'],
                        ['defectos_produccion',  'Def. Prod.', 'bg-rose-50 border-rose-100'],
                      ] as [keyof IterForm, string, string][]).map(([key, label, cls]) => (
                        <div key={key} className={`flex-1 flex items-center justify-between rounded-lg border px-3 py-2 ${cls}`}>
                          <span className="text-xs text-slate-500">{label}</span>
                          <input type="number" min={0} value={form[key] as number}
                            onChange={e => setField(key, Number(e.target.value) as any)}
                            className="w-10 text-center text-sm font-bold bg-transparent border-none outline-none text-slate-700"
                            disabled={!canEdit} />
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection icon={Link2} label="Evidencias y Observaciones" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Evidencias */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Link2 className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-semibold text-slate-500">Evidencias</span>
                        </div>
                        <input
                          value={form.rutas_evidencias}
                          onChange={e => setField('rutas_evidencias', e.target.value)}
                          placeholder="URL, SharePoint, Drive…"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                          disabled={!canEdit}
                        />
                        {form.rutas_evidencias && (
                          <a
                            href={form.rutas_evidencias}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            Abrir enlace
                          </a>
                        )}
                      </div>
                      {/* Observaciones */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <PenLine className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-semibold text-slate-500">Observaciones</span>
                        </div>
                        <textarea
                          value={form.observaciones_estado}
                          onChange={e => setField('observaciones_estado', e.target.value)}
                          placeholder="Escribe observaciones del estado actual…"
                          rows={3}
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50/60">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cerrar
          </Button>
          {canEdit && form && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? 'Guardando…' : 'Guardar Cambios'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
