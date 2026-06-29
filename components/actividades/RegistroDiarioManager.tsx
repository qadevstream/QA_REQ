'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, ChevronDown, ClipboardList, Upload } from 'lucide-react'
import { createRegistroDiarioAction, updateRegistroDiarioAction, deleteRegistroDiarioAction } from '@/server/actions/registroDiario'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ImportRegistroDiarioDialog } from './ImportRegistroDiarioDialog'
import { TIPO_REQUERIMIENTO_LABELS, PERIODOS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type {
  RegistroDiario, Profile, AplicativoCatalogo, CatTipoTarea, TipoRequerimientoEnum,
} from '@/types/domain.types'

function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}
        className={`w-full appearance-none rounded-md border border-slate-200 bg-white px-2.5 py-2 pr-7 text-xs
          outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer ${className}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs
        outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 ${className}`}
    />
  )
}

const EMPTY = {
  periodo: '', iteracion: '1', aplicativo: '', codigo_app: '', tipo_solicitud: '',
  tipo_tarea: '', qa_id: '', horas_ejecutadas: '', perfil: 'EP11', nro_ticket: '',
  fecha_reporte: new Date().toISOString().slice(0, 10), observaciones: '',
}
type FormState = typeof EMPTY

interface RegistroDiarioManagerProps {
  initialRegistros: RegistroDiario[]
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
  tiposTarea: CatTipoTarea[]
  currentUserId: string
  isSupervisor: boolean
}

export function RegistroDiarioManager({ initialRegistros, analistas, aplicativos, tiposTarea, currentUserId, isSupervisor }: RegistroDiarioManagerProps) {
  const router = useRouter()
  // Aplicativos ordenados alfabéticamente (A-Z) por nombre para los dropdowns
  const aplicativosOrdenados = [...aplicativos].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  )
  const [registros, setRegistros] = useState(initialRegistros)
  const [form, setForm] = useState<FormState>({ ...EMPTY, qa_id: currentUserId })
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [importOpen, setImportOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingRegistro, setEditingRegistro] = useState<RegistroDiario | null>(null)
  const [editForm, setEditForm] = useState<FormState>({ ...EMPTY })
  const [isSaving, startSave] = useTransition()

  // Referencia estable a analistas para el closure del efecto
  const analistasRef = useRef(analistas)
  useEffect(() => { analistasRef.current = analistas }, [analistas])

  // Realtime: sincroniza la lista entre todos los analistas conectados
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('registro_diario_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registro_diario' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          // Ignorar inserts propios (ya se manejan de forma optimista)
          if (row.created_by === currentUserId) return
          // ANALISTA_QA solo ve sus propios registros
          if (!isSupervisor && row.qa_id !== currentUserId) return

          const qa = analistasRef.current.find((a) => a.id === row.qa_id) ?? null
          const nuevo = { ...row, qa } as unknown as typeof registros[0]

          setRegistros((prev) =>
            prev.some((r) => r.id === row.id) ? prev : [nuevo, ...prev]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'registro_diario' },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setRegistros((prev) => prev.filter((r) => r.id !== id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, isSupervisor])

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function handlePeriodoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, periodo: e.target.value }))
  }

  // Al elegir la aplicación, autocompletar el CÓDIGO APP con su código.
  function handleAplicativoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const codigo = e.target.value
    setForm((prev) => ({ ...prev, aplicativo: codigo, codigo_app: codigo }))
  }

  function handleAdd() {
    if (!form.periodo.trim()) { toast.error('El período es obligatorio.'); return }
    if (!form.horas_ejecutadas || Number(form.horas_ejecutadas) <= 0) {
      toast.error('Las horas ejecutadas deben ser mayores a 0.')
      return
    }

    startTransition(async () => {
      const result = await createRegistroDiarioAction({
        periodo: form.periodo.trim(),
        iteracion: form.iteracion ? Number(form.iteracion) : undefined,
        aplicativo: form.aplicativo || undefined,
        codigo_app: form.codigo_app || undefined,
        tipo_solicitud: (form.tipo_solicitud || undefined) as TipoRequerimientoEnum | undefined,
        tipo_tarea: form.tipo_tarea || undefined,
        qa_id: form.qa_id || undefined,
        horas_ejecutadas: Number(form.horas_ejecutadas),
        perfil: form.perfil || undefined,
        nro_ticket: form.nro_ticket || undefined,
        fecha_reporte: form.fecha_reporte || undefined,
        observaciones: form.observaciones || undefined,
      })

      if (result.success) {
        toast.success(result.message ?? 'Actividad registrada.')
        setRegistros((prev) => [result.data, ...prev])
        setForm({ ...EMPTY, qa_id: currentUserId, fecha_reporte: new Date().toISOString().slice(0, 10) })
      } else {
        toast.error(result.error)
      }
    })
  }

  function openEdit(r: RegistroDiario) {
    setEditingRegistro(r)
    setEditForm({
      periodo: r.periodo,
      iteracion: r.iteracion != null ? String(r.iteracion) : '1',
      aplicativo: r.aplicativo ?? '',
      codigo_app: r.codigo_app ?? '',
      tipo_solicitud: r.tipo_solicitud ?? '',
      tipo_tarea: r.tipo_tarea ?? '',
      qa_id: r.qa_id ?? '',
      horas_ejecutadas: String(r.horas_ejecutadas),
      perfil: r.perfil ?? 'EP11',
      nro_ticket: r.nro_ticket ?? '',
      fecha_reporte: r.fecha_reporte ?? new Date().toISOString().slice(0, 10),
      observaciones: r.observaciones ?? '',
    })
  }

  function handleSaveEdit() {
    if (!editingRegistro) return
    startSave(async () => {
      const result = await updateRegistroDiarioAction(editingRegistro.id, {
        periodo: editForm.periodo,
        iteracion: editForm.iteracion ? Number(editForm.iteracion) : undefined,
        aplicativo: editForm.aplicativo || undefined,
        codigo_app: editForm.codigo_app || undefined,
        tipo_solicitud: (editForm.tipo_solicitud || undefined) as never,
        tipo_tarea: editForm.tipo_tarea || undefined,
        qa_id: editForm.qa_id || undefined,
        horas_ejecutadas: Number(editForm.horas_ejecutadas),
        perfil: editForm.perfil || undefined,
        nro_ticket: editForm.nro_ticket || undefined,
        fecha_reporte: editForm.fecha_reporte || undefined,
        observaciones: editForm.observaciones || undefined,
      })
      if (result.success) {
        setRegistros((prev) => prev.map((r) => r.id === result.data.id ? result.data : r))
        toast.success(result.message ?? 'Registro actualizado.')
        setEditingRegistro(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const setEditField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }))

  // Al elegir la aplicación en edición, autocompletar también el CÓDIGO APP.
  function handleEditAplicativoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const codigo = e.target.value
    setEditForm((prev) => ({ ...prev, aplicativo: codigo, codigo_app: codigo }))
  }

  function confirmDelete() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    startDelete(async () => {
      const result = await deleteRegistroDiarioAction(id)
      if (result.success) {
        setRegistros((prev) => prev.filter((r) => r.id !== id))
        toast.success('Registro eliminado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const totalHoras = registros.reduce((sum, r) => sum + r.horas_ejecutadas, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Actividades — Registro Diario</h1>
            <p className="text-muted-foreground text-sm mt-1">Bitácora de actividades del equipo QA</p>
          </div>
          <div className="flex items-center gap-2">
            {isSupervisor && (
              <button
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />Importar Excel
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {registros.length} registro{registros.length !== 1 ? 's' : ''} · {totalHoras.toFixed(2)} h
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 py-6 gap-4 overflow-hidden min-h-0">
        {/* Fila de captura rápida */}
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-blue-50/40">
            <ClipboardList className="h-4 w-4 text-[#0184EF]" />
            <p className="text-sm font-bold text-slate-800">Agregar Actividad del Día</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="grid gap-2 min-w-[1180px]" style={{ gridTemplateColumns: '180px 60px 130px 110px 140px 150px 140px 90px 110px 110px 120px 1fr 36px' }}>
              {/* Encabezados */}
              {['PERIODO', 'ITER.', 'APLICACIÓN', 'CÓDIGO APP', 'TIPO SOLICITUD', 'TIPO TAREA', 'NOMBRE QA', 'HORAS', 'PERFIL', 'NRO TICKET', 'FECHA REPORTE', 'OBSERVACIONES', ''].map((h) => (
                <p key={h} className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{h}</p>
              ))}

              <Select value={form.periodo} onChange={handlePeriodoChange}>
                <option value="">Seleccionar…</option>
                {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
              <Input type="number" min={1} max={6} value={form.iteracion} onChange={setField('iteracion')} className="text-center" placeholder="—" />
              <Select value={form.aplicativo} onChange={handleAplicativoChange}>
                <option value="">—</option>
                {aplicativosOrdenados.map((a) => <option key={a.codigo} value={a.codigo}>{a.nombre}</option>)}
              </Select>
              <Input value={form.codigo_app} onChange={setField('codigo_app')} placeholder="Código" />
              <Select value={form.tipo_solicitud} onChange={setField('tipo_solicitud')}>
                <option value="">—</option>
                {Object.entries(TIPO_REQUERIMIENTO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Select value={form.tipo_tarea} onChange={setField('tipo_tarea')}>
                <option value="">—</option>
                {tiposTarea.map((t) => <option key={t.tipo_tarea} value={t.tipo_tarea}>{t.tipo_tarea}</option>)}
              </Select>
              <Select value={form.qa_id} onChange={setField('qa_id')}>
                <option value="">—</option>
                {analistas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}{a.role === 'SUPERVISOR' ? ' [SUP]' : a.role === 'CLIENTE' ? ' [CLI]' : ''}
                  </option>
                ))}
              </Select>
              <Input type="number" min={0} step={0.01} value={form.horas_ejecutadas} onChange={setField('horas_ejecutadas')} placeholder="8.00" />
              <Select value={form.perfil} onChange={setField('perfil')}>
                <option value="EP11">EP11</option>
                <option value="AP11">AP11</option>
              </Select>
              <Input value={form.nro_ticket} onChange={setField('nro_ticket')} placeholder="TCK-001" />
              <Input type="date" value={form.fecha_reporte} onChange={setField('fecha_reporte')} />
              <Input value={form.observaciones} onChange={setField('observaciones')} placeholder="Observaciones..." />

              <button
                onClick={handleAdd}
                disabled={isPending}
                title="Agregar"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0184EF] text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de registros */}
        {registros.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <ClipboardList className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Sin actividades registradas</p>
            <p className="mt-1 text-xs text-slate-400">Usa el formulario de arriba para agregar tu primera actividad.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto overflow-y-auto">
            <table className="w-full text-xs min-w-[1100px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 text-center">Período</th>
                  <th className="px-3 py-2 text-center">Iter.</th>
                  <th className="px-3 py-2 text-center">Aplicación</th>
                  <th className="px-3 py-2 text-center">Código App</th>
                  <th className="px-3 py-2 text-center">Tipo Solicitud</th>
                  <th className="px-3 py-2 text-center">Tipo Tarea</th>
                  <th className="px-3 py-2 text-center">QA</th>
                  <th className="px-3 py-2 text-center">Horas</th>
                  <th className="px-3 py-2 text-center">Perfil</th>
                  <th className="px-3 py-2 text-center">Ticket</th>
                  <th className="px-3 py-2 text-center">Fecha</th>
                  <th className="px-3 py-2 text-left">Observaciones</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 group">
                    <td className="px-3 py-2 text-center">{r.periodo}</td>
                    <td className="px-3 py-2 text-center">{r.iteracion ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{r.aplicativo ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{r.codigo_app ?? '—'}</td>
                    <td className="px-3 py-2 text-center">{r.tipo_solicitud ? TIPO_REQUERIMIENTO_LABELS[r.tipo_solicitud] : '—'}</td>
                    <td className="px-3 py-2 text-center">{r.tipo_tarea ?? '—'}</td>
                    <td className="px-3 py-2 text-center font-medium">{r.qa?.full_name ?? '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold">{r.horas_ejecutadas.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">{r.perfil ?? '—'}</td>
                    <td className="px-3 py-2 text-center font-mono">{r.nro_ticket ?? '—'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{formatDate(r.fecha_reporte)}</td>
                    <td className="px-3 py-2 text-left max-w-[200px] truncate">{r.observaciones ?? '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 justify-center">
                        <button
                          onClick={() => openEdit(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(r.id)}
                          disabled={isDeleting}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="shrink-0 text-center text-xs text-slate-400">DevStream · QA Control Center v1.0</p>
      </main>

      {isSupervisor && (
        <ImportRegistroDiarioDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          analistas={analistas}
          onImported={() => router.refresh()}
        />
      )}

      <Dialog open={editingRegistro !== null} onOpenChange={(open) => !open && setEditingRegistro(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Período</p>
              <Select value={editForm.periodo} onChange={setEditField('periodo')}>
                <option value="">Seleccionar…</option>
                {PERIODOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Iter.</p>
              <Input type="number" min={1} max={6} value={editForm.iteracion} onChange={setEditField('iteracion')} className="text-center" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Aplicación</p>
              <Select value={editForm.aplicativo} onChange={handleEditAplicativoChange}>
                <option value="">—</option>
                {aplicativosOrdenados.map((a) => <option key={a.codigo} value={a.codigo}>{a.nombre}</option>)}
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Tipo Solicitud</p>
              <Select value={editForm.tipo_solicitud} onChange={setEditField('tipo_solicitud')}>
                <option value="">—</option>
                {Object.entries(TIPO_REQUERIMIENTO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Tipo Tarea</p>
              <Select value={editForm.tipo_tarea} onChange={setEditField('tipo_tarea')}>
                <option value="">—</option>
                {tiposTarea.map((t) => <option key={t.tipo_tarea} value={t.tipo_tarea}>{t.tipo_tarea}</option>)}
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Nombre QA</p>
              <Select value={editForm.qa_id} onChange={setEditField('qa_id')}>
                <option value="">—</option>
                {analistas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}{a.role === 'SUPERVISOR' ? ' [SUP]' : a.role === 'CLIENTE' ? ' [CLI]' : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Horas</p>
              <Input type="number" min={0} step={0.01} value={editForm.horas_ejecutadas} onChange={setEditField('horas_ejecutadas')} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Perfil</p>
              <Select value={editForm.perfil} onChange={setEditField('perfil')}>
                <option value="EP11">EP11</option>
                <option value="AP11">AP11</option>
              </Select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Nro. Ticket</p>
              <Input value={editForm.nro_ticket} onChange={setEditField('nro_ticket')} placeholder="TCK-001" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Código App</p>
              <Input value={editForm.codigo_app} onChange={setEditField('codigo_app')} placeholder="Código" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Fecha Reporte</p>
              <Input type="date" value={editForm.fecha_reporte} onChange={setEditField('fecha_reporte')} />
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Observaciones</p>
              <Input value={editForm.observaciones} onChange={setEditField('observaciones')} placeholder="Observaciones..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRegistro(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las horas del requerimiento asociado serán recalculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
