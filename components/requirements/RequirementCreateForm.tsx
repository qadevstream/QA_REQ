'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Save, RotateCcw, AlertCircle, Hash, Calendar,
  User, Layers, Bug, Link as LinkIcon,
  ChevronDown,
} from 'lucide-react'
import { createRequirementAction } from '@/server/actions/requirements'
import { TIPO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import { PrioridadSelect } from '@/components/shared/PrioridadSelect'
import type { ActionResult, AplicativoCatalogo, Requirement, Profile } from '@/types/domain.types'
import type { ActividadPrioridadEnum } from '@/types/database.types'

// ─── Catálogos estáticos ──────────────────────────────────────
const TIPOS = Object.entries(TIPO_REQUERIMIENTO_LABELS).map(([value, label]) => ({ value, label }))

// ─── UI primitivos ────────────────────────────────────────────
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  )
}

function Input({ icon: Icon, error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ElementType; error?: string }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
      <input {...props}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
          outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          ${Icon ? 'pl-9' : ''}
          ${error ? 'border-red-400 bg-red-50/40' : 'border-slate-200 hover:border-slate-300'}
          ${className}`}
      />
    </div>
  )
}

function Select({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="relative">
      <select {...props}
        className={`w-full appearance-none rounded-md border bg-white px-3 py-2 pr-8 text-sm text-slate-900
          outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer
          ${error ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}
          ${!props.value ? 'text-slate-400' : ''}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  )
}

function Textarea({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea {...props}
      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
        outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none
        ${error ? 'border-red-400' : 'border-slate-200 hover:border-slate-300'}`}
    />
  )
}

function SectionCard({ id, icon: Icon, title, accent = '#0184EF', children }: {
  id: string; icon: React.ElementType; title: string; accent?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100"
        style={{ background: `${accent}08` }}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}18` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

// ─── Form state ───────────────────────────────────────────────
const EMPTY = {
  nro_req: '', tipo: '', aplicativo: '', ati_responsable: '', prioridad: 'MEDIA', qa_responsable: '',
  qa_apoyo_1: '', qa_apoyo_2: '', qa_apoyo_3: '',
  titulo: '', descripcion: '',
  estado_qa: 'PEND_ASIGNACION', estado_req: '', avance_porcentaje: 0, iteracion: 1,
  cp_ok: 0, cp_fallo: 0,
  horas_estimadas: 0,
  fecha_asignacion: '', fecha_entrega_estimacion: '', fecha_aprobacion_estimacion: '',
  fecha_inicio_planificada: '', fecha_inicio_real: '',
  fecha_entrega_planificada: '', fecha_entrega_real: '',
  defectos_qa: 0, defectos_uat: 0, defectos_produccion: 0,
  rutas_evidencias: '', observaciones_estado: '',
}
type FormData = typeof EMPTY
type Errors = Partial<Record<keyof FormData, string>>

function validate(d: FormData): Errors {
  const e: Errors = {}
  if (!d.nro_req.trim())    e.nro_req    = 'Obligatorio'
  if (!d.aplicativo)        e.aplicativo = 'Obligatorio'
  if (!d.titulo.trim())     e.titulo     = 'Obligatorio'
  return e
}

interface RequirementCreateFormProps {
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
}

const initialState: ActionResult<Requirement> | null = null

export function RequirementCreateForm({ analistas, aplicativos }: RequirementCreateFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createRequirementAction, initialState)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!state) return
    if (state.success) {
      toast.success(state.message ?? 'Requerimiento registrado.')
      router.push('/requirements')
    } else {
      toast.error(state.error)
    }
  }, [state, router])

  const f = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
      setForm(prev => ({ ...prev, [field]: val }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

  function handleClientSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      e.preventDefault()
      setErrors(errs)
      toast.error('Completa los campos obligatorios marcados en rojo.')
      document.getElementById('sec-identificacion')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleReset = () => { setForm(EMPTY); setErrors({}) }

  const totalDefectos = form.defectos_qa + form.defectos_uat + form.defectos_produccion

  return (
    <form action={formAction} onSubmit={handleClientSubmit} className="flex-1 flex flex-col overflow-auto">

      {/* Topbar sticky con acciones */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900">Nuevo Requerimiento</h1>
            <p className="text-xs text-slate-400">Completa todos los campos y guarda al finalizar</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />Limpiar
            </button>
            <button type="submit" disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-[#0184EF] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60">
              <Save className="h-4 w-4" />{isPending ? 'Guardando…' : 'Registrar Requerimiento'}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido scrolleable */}
      <main className="flex-1 px-6 py-6 space-y-5 max-w-[1400px] w-full mx-auto">

        {/* ── 1. Identificación ── */}
        <SectionCard id="sec-identificacion" icon={Hash} title="Identificación del Requerimiento">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
            <div>
              <Label text="Nro. de Requerimiento" required />
              <Input name="nro_req" value={form.nro_req} onChange={f('nro_req')} placeholder="REQ-0001"
                icon={Hash} error={errors.nro_req} />
              <Err msg={errors.nro_req} />
            </div>
            <div>
              <Label text="Aplicativo" required />
              <Select name="aplicativo" value={form.aplicativo}
                onChange={(e) => {
                  const codigo = e.target.value
                  const ap = aplicativos.find((a) => a.codigo === codigo)
                  setForm(prev => ({
                    ...prev,
                    aplicativo: codigo,
                    ati_responsable: ap?.ati_responsable ?? '',
                  }))
                  if (errors.aplicativo) setErrors(prev => ({ ...prev, aplicativo: undefined }))
                }}
                error={errors.aplicativo}>
                <option value="">Seleccionar…</option>
                {[...aplicativos].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es')).map((a) => <option key={a.codigo} value={a.codigo}>{a.codigo.toUpperCase()} — {a.nombre.toUpperCase()}</option>)}
              </Select>
              <Err msg={errors.aplicativo} />
            </div>
            <div>
              <Label text="Tipo" />
              <Select name="tipo" value={form.tipo} onChange={f('tipo')}>
                <option value="">Seleccionar…</option>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div>
              <Label text="Fecha Asignación" />
              <Input type="date" name="fecha_asignacion" value={form.fecha_asignacion} onChange={f('fecha_asignacion')} icon={Calendar} />
            </div>
            <div>
              <Label text="Fecha Entrega Estimación" />
              <Input type="date" name="fecha_entrega_estimacion" value={form.fecha_entrega_estimacion} onChange={f('fecha_entrega_estimacion')} icon={Calendar} />
            </div>
            <div>
              <Label text="Fecha Aprobación Estimación" />
              <Input type="date" name="fecha_aprobacion_estimacion" value={form.fecha_aprobacion_estimacion} onChange={f('fecha_aprobacion_estimacion')} icon={Calendar} />
            </div>
            <div>
              {(() => {
                const locked = !!(form.aplicativo && aplicativos.find((a) => a.codigo === form.aplicativo)?.ati_responsable)
                return (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        ATI Responsable
                      </label>
                      {locked && (
                        <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                          Desde catálogo
                        </span>
                      )}
                    </div>
                    {locked && (
                      <input type="hidden" name="ati_responsable" value={form.ati_responsable} />
                    )}
                    <Input
                      name={locked ? undefined : 'ati_responsable'}
                      value={form.ati_responsable}
                      onChange={f('ati_responsable')}
                      placeholder="Nombre del responsable ATI"
                      icon={User}
                      disabled={locked}
                      className={locked ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100' : ''}
                    />
                  </>
                )
              })()}
            </div>
            <div>
              <Label text="Avance (%)" />
              <Input type="number" name="avance_porcentaje" min={0} max={100} value={form.avance_porcentaje}
                onChange={f('avance_porcentaje')} placeholder="0" />
            </div>
            <div>
              <Label text="Prioridad" />
              <PrioridadSelect
                value={form.prioridad as ActividadPrioridadEnum}
                onChange={v => setForm(prev => ({ ...prev, prioridad: v }))}
              />
            </div>
          </div>

          <div className="mt-5 mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo QA Asignado</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
            <div className="rounded-lg border-2 border-[#0184EF]/30 bg-blue-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0184EF] text-[10px] font-bold text-white">1</span>
                <Label text="QA Responsable Principal" />
              </div>
              <Select name="qa_responsable" value={form.qa_responsable} onChange={f('qa_responsable')}>
                <option value="">Sin asignar</option>
                {analistas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}{a.role === 'SUPERVISOR' ? ' [SUP]' : a.role === 'CLIENTE' ? ' [CLI]' : ''}
                  </option>
                ))}
              </Select>
            </div>

            {(['qa_apoyo_1', 'qa_apoyo_2', 'qa_apoyo_3'] as const).map((field, idx) => (
              <div key={field} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-[10px] font-bold text-white">{idx + 2}</span>
                  <Label text="QA Analista de Apoyo" />
                </div>
                <Select name={field} value={form[field]} onChange={f(field)}>
                  <option value="">Sin asignar</option>
                  {analistas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}{a.role === 'SUPERVISOR' ? ' [SUP]' : a.role === 'CLIENTE' ? ' [CLI]' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── 2. Descripción ── */}
        <SectionCard id="sec-descripcion" icon={Layers} title="Descripción del Requerimiento">
          <div className="space-y-4">
            <div>
              <Label text="Título" required />
              <Input name="titulo" value={form.titulo} onChange={f('titulo')}
                placeholder="Nombre descriptivo del requerimiento" error={errors.titulo} />
              <Err msg={errors.titulo} />
            </div>
            <div>
              <Label text="Descripción — Objetivo, Beneficios y Módulos" />
              <Textarea name="descripcion" value={form.descripcion} onChange={f('descripcion')} rows={6}
                placeholder={'Objetivo:\n\nBeneficios:\n\nMódulos afectados:'} />
            </div>
          </div>
        </SectionCard>

        {/* ── 6. Defectos ── */}
        <SectionCard id="sec-defectos" icon={Bug} title="Registro de Defectos" accent="#EF4444">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center space-y-2">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Defectos en QA</p>
              <input type="number" name="defectos_qa" min={0} value={form.defectos_qa}
                onChange={f('defectos_qa')}
                className="w-full bg-transparent text-center text-3xl font-bold text-blue-700 outline-none" />
            </div>
            <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-center space-y-2">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Defectos en UAT</p>
              <input type="number" name="defectos_uat" min={0} value={form.defectos_uat}
                onChange={f('defectos_uat')}
                className="w-full bg-transparent text-center text-3xl font-bold text-amber-600 outline-none" />
            </div>
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center space-y-2">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Defectos en Producción</p>
              <input type="number" name="defectos_produccion" min={0} value={form.defectos_produccion}
                onChange={f('defectos_produccion')}
                className="w-full bg-transparent text-center text-3xl font-bold text-red-600 outline-none" />
            </div>
          </div>
          {totalDefectos > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-5 py-3">
              <span className="text-sm font-semibold text-slate-600">Total de Defectos</span>
              <span className="text-2xl font-bold text-red-600">{totalDefectos}</span>
            </div>
          )}
        </SectionCard>

        {/* ── 7. Evidencias y Observaciones ── */}
        <SectionCard id="sec-evidencias" icon={LinkIcon} title="Rutas de Estimación, Evidencias y Observaciones" accent="#DB2777">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <Label text="Rutas de Estimación y Evidencias de Pruebas" />
              <Textarea name="rutas_evidencias" value={form.rutas_evidencias} onChange={f('rutas_evidencias')} rows={3}
                placeholder={'https://drive.google.com/...\nhttps://confluence.empresa.com/...'} />
            </div>
            <div>
              <Label text="Observaciones de Estado (tck)" />
              <Textarea name="observaciones_estado" value={form.observaciones_estado} onChange={f('observaciones_estado')} rows={3}
                placeholder="Observaciones sobre el estado actual..." />
            </div>
          </div>
        </SectionCard>

        <p className="pb-4 text-center text-xs text-slate-400">DevStream · QA Control Center v1.0</p>
      </main>
    </form>
  )
}
