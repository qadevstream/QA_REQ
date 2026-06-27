'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  UserPlus, Trash2, Mail, IdCard, User,
  CheckCircle2, AlertCircle, Briefcase, Shield, ChevronDown, KeyRound,
} from 'lucide-react'
import { createAnalistaAction, deleteAnalistaAction, sendPasswordResetAction } from '@/server/actions/analistas'
import type { AnalistaConCorreo } from '@/server/actions/analistas'
import { CARGO_LABELS } from '@/lib/constants'
import type { ActionResult } from '@/types/domain.types'

const CARGOS = Object.entries(CARGO_LABELS).map(([value, label]) => ({ value, label }))

const CARGO_COLORS: Record<string, { bg: string; text: string }> = {
  ADMINISTRADOR:      { bg: 'bg-red-100',    text: 'text-red-700' },
  SUPERVISOR_QA:      { bg: 'bg-purple-100', text: 'text-purple-700' },
  ANALISTA_QA_SENIOR: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  ANALISTA_QA:        { bg: 'bg-sky-100',     text: 'text-sky-700' },
  ANALISTA_QA_JUNIOR: { bg: 'bg-slate-100',   text: 'text-slate-600' },
  TESTER:             { bg: 'bg-green-100',   text: 'text-green-700' },
  EXT:                { bg: 'bg-orange-100',  text: 'text-orange-700' },
}

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

function Input({ icon: Icon, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType; error?: string
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
      <input {...props}
        className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
          outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          ${Icon ? 'pl-9' : ''}
          ${error ? 'border-red-400 bg-red-50/40' : 'border-slate-200 hover:border-slate-300'}`}
      />
    </div>
  )
}

function SelectField({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="relative">
      <select {...props}
        className={`w-full appearance-none rounded-md border bg-white px-3 py-2.5 pr-8 text-sm
          outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer
          ${error ? 'border-red-400 bg-red-50/40' : 'border-slate-200 hover:border-slate-300'}
          ${!props.value ? 'text-slate-400' : 'text-slate-900'}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  )
}

const EMPTY = { nombre: '', cargo: '', correo: '', dni: '' }
type FormState = typeof EMPTY
type Errors = Partial<Record<keyof FormState, string>>

function validateClient(f: FormState): Errors {
  const e: Errors = {}
  if (!f.nombre.trim())  e.nombre = 'El nombre completo es obligatorio'
  if (!f.cargo)          e.cargo  = 'Selecciona un cargo'
  if (!f.correo.trim())  e.correo = 'El correo es obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) e.correo = 'Formato de correo inválido'
  if (!f.dni.trim())     e.dni    = 'El DNI es obligatorio'
  else if (!/^\d{8}$/.test(f.dni)) e.dni = 'El DNI debe tener exactamente 8 dígitos'
  return e
}

interface AnalistasManagerProps {
  initialAnalistas: AnalistaConCorreo[]
}

const initialState: ActionResult<AnalistaConCorreo> | null = null

export function AnalistasManager({ initialAnalistas }: AnalistasManagerProps) {
  const [state, formAction, isPending] = useActionState(createAnalistaAction, initialState)
  const [analistas, setAnalistas] = useState(initialAnalistas)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [isDeleting, startDelete] = useTransition()
  const [isResetting, startReset] = useTransition()
  const [resettingId, setResettingId] = useState<string | null>(null)

  useEffect(() => {
    if (!state) return
    if (state.success) {
      toast.success(state.message ?? 'Usuario creado.')
      setAnalistas((prev) => [state.data, ...prev])
      setForm(EMPTY)
      setErrors({})
    } else {
      toast.error(state.error)
    }
  }, [state])

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

  function handleClientSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validateClient(form)
    if (Object.keys(errs).length > 0) {
      e.preventDefault()
      setErrors(errs)
    }
  }

  function handleEliminar(id: string, nombre: string) {
    startDelete(async () => {
      const result = await deleteAnalistaAction(id)
      if (result.success) {
        setAnalistas((prev) => prev.filter((a) => a.id !== id))
        toast.success(`Analista ${nombre} eliminado del sistema.`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleReset(correo: string, id: string) {
    setResettingId(id)
    startReset(async () => {
      const result = await sendPasswordResetAction(correo)
      setResettingId(null)
      if (result.success) {
        toast.success(`Enlace de restablecimiento enviado a ${correo}.`)
      } else {
        toast.error(result.error)
      }
    })
  }

  const initials = (nombre: string) =>
    nombre.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Analistas QA</h1>
            <p className="text-muted-foreground text-sm mt-1">Administra los usuarios del equipo QA</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {analistas.length} usuario{analistas.length !== 1 ? 's' : ''} registrado{analistas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analistas QA</h2>
          <p className="mt-1 text-sm text-slate-500">
            Al registrar un analista se crea su cuenta de acceso al sistema (Supabase Auth).
          </p>
        </div>

        <form action={formAction} onSubmit={handleClientSubmit}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-blue-50/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0184EF]">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Crear Nuevo Usuario</p>
              <p className="text-xs text-slate-500">Se creará una cuenta de acceso para el analista</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Solo Supervisor puede crear usuarios</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Label text="Nombre Completo" required />
                <Input name="nombre" icon={User} value={form.nombre} onChange={setField('nombre')}
                  placeholder="Ej: María García López" error={errors.nombre} />
                <Err msg={errors.nombre} />
              </div>

              <div>
                <Label text="Cargo" required />
                <SelectField name="cargo" value={form.cargo} onChange={setField('cargo')} error={errors.cargo}>
                  <option value="">Seleccionar cargo…</option>
                  {CARGOS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </SelectField>
                <Err msg={errors.cargo} />
              </div>

              <div>
                <Label text="DNI" required />
                <Input name="dni" icon={IdCard} value={form.dni} onChange={setField('dni')}
                  placeholder="12345678" maxLength={8} error={errors.dni} />
                <Err msg={errors.dni} />
              </div>

              <div className="lg:col-span-4">
                <Label text="Correo Electrónico" required />
                <Input name="correo" icon={Mail} type="email" value={form.correo} onChange={setField('correo')}
                  placeholder="correo@empresa.com — se usará como usuario de ingreso al sistema" error={errors.correo} />
                <Err msg={errors.correo} />
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Al crear el usuario, deberá usar &quot;¿Olvidaste tu contraseña?&quot; en el login con este correo
                para establecer su contraseña la primera vez.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-[#0184EF] px-6 py-2.5 text-sm font-semibold text-white
                  hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creando usuario…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {analistas.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <User className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Sin analistas registrados</p>
            <p className="mt-1 text-xs text-slate-400">Completa el formulario de arriba para crear el primer usuario.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Equipo QA Registrado</p>
              <span className="text-xs text-slate-400">
                {analistas.length} usuario{analistas.length !== 1 ? 's' : ''} activo{analistas.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Analista</div>
              <div className="col-span-2">Cargo</div>
              <div className="col-span-3">Correo</div>
              <div className="col-span-1">DNI</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-1 text-right">Acción</div>
            </div>

            <div className="divide-y divide-slate-100">
              {analistas.map((a) => {
                const cargoColor = CARGO_COLORS[a.cargo] ?? { bg: 'bg-slate-100', text: 'text-slate-600' }
                const cargoLabel = CARGO_LABELS[a.cargo] ?? a.cargo
                return (
                  <div key={a.id} className="grid grid-cols-12 gap-4 items-center px-6 py-3.5 hover:bg-slate-50/70 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0184EF] text-white text-xs font-bold">
                        {initials(a.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{a.full_name}</p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cargoColor.bg} ${cargoColor.text}`}>
                        <Briefcase className="h-3 w-3" />
                        {cargoLabel}
                      </span>
                    </div>

                    <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{a.correo}</span>
                    </div>

                    <div className="col-span-1 flex items-center gap-1">
                      <IdCard className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-mono text-slate-600">{a.dni ?? '—'}</span>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />Activo
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end gap-1">
                      <button
                        onClick={() => handleReset(a.correo, a.id)}
                        disabled={isResetting || a.correo === '—'}
                        className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-50"
                        title="Enviar enlace de restablecimiento de contraseña"
                      >
                        <KeyRound className={`h-4 w-4 ${isResetting && resettingId === a.id ? 'animate-pulse' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEliminar(a.id, a.full_name)}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                        title="Eliminar analista"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="pb-4 text-center text-xs text-slate-400">DevStream · QA Control Center v1.0</p>
      </main>
    </div>
  )
}
