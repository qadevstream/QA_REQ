'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Pencil, Check, X, Trash2, ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apLabelShort } from '@/lib/aplicativos'
import { TIPO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import { updateRequirementAction, deleteRequirementAction } from '@/server/actions/requirements'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RequirementDetailDialog } from './RequirementDetailDialog'
import type { Requirement, AplicativoCatalogo, Profile } from '@/types/domain.types'
import type { TipoRequerimientoEnum } from '@/types/database.types'

interface Props {
  requirements: Requirement[]
  aplicativos?: AplicativoCatalogo[]
  analistas?: Profile[]
  canEdit?: boolean
  openId?: string
}

const IC = 'w-full rounded border border-slate-200 bg-white px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-400'

function Txt({ v, set, ph = '' }: { v: string; set: (s: string) => void; ph?: string }) {
  return <input type="text" value={v} onChange={e => set(e.target.value)} placeholder={ph} className={IC} />
}
function Sel({ v, set, opts }: { v: string; set: (s: string) => void; opts: { value: string; label: string }[] }) {
  return (
    <select value={v} onChange={e => set(e.target.value)} className={`${IC} cursor-pointer`}>
      <option value="">—</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

type EF = {
  titulo: string
  descripcion: string
  aplicativo: string
  tipo_requerimiento: string
  ati_responsable: string
  responsable_qa_id: string
  qa_apoyo_1_id: string
  qa_apoyo_2_id: string
  qa_apoyo_3_id: string
}

function toEditForm(r: Requirement): EF {
  return {
    titulo: r.titulo ?? '',
    descripcion: r.descripcion ?? '',
    aplicativo: r.aplicativo ?? '',
    tipo_requerimiento: r.tipo_requerimiento ?? '',
    ati_responsable: r.ati_responsable ?? '',
    responsable_qa_id: r.responsable_qa_id ?? '',
    qa_apoyo_1_id: r.qa_apoyo_1_id ?? '',
    qa_apoyo_2_id: r.qa_apoyo_2_id ?? '',
    qa_apoyo_3_id: r.qa_apoyo_3_id ?? '',
  }
}

export function RequirementTable({ requirements, aplicativos = [], analistas = [], canEdit = false, openId }: Props) {
  const [rows, setRows] = useState(requirements)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ef, setEf] = useState<EF | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, startDelete] = useTransition()
  const [detailReq, setDetailReq] = useState<Requirement | null>(null)

  useEffect(() => {
    if (openId) {
      const found = requirements.find(r => r.id === openId)
      if (found) setDetailReq(found)
    }
  }, [openId, requirements])

  function confirmDelete() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    startDelete(async () => {
      const result = await deleteRequirementAction(id)
      if (result.success) {
        setRows(prev => prev.filter(r => r.id !== id))
        toast.success('Requerimiento eliminado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function startEdit(r: Requirement) { setEditingId(r.id); setEf(toEditForm(r)) }
  function cancelEdit() { setEditingId(null); setEf(null) }

  function s(field: keyof EF) {
    return (v: string) => setEf(prev => prev ? { ...prev, [field]: v } : prev)
  }

  function handleSave(id: string) {
    if (!ef) return
    startTransition(async () => {
      const result = await updateRequirementAction(id, {
        titulo: ef.titulo,
        descripcion: ef.descripcion || undefined,
        aplicativo: ef.aplicativo,
        tipo_requerimiento: (ef.tipo_requerimiento as TipoRequerimientoEnum) || undefined,
        ati_responsable: ef.ati_responsable || undefined,
        responsable_qa_id: ef.responsable_qa_id || undefined,
        qa_apoyo_1_id: ef.qa_apoyo_1_id || undefined,
        qa_apoyo_2_id: ef.qa_apoyo_2_id || undefined,
        qa_apoyo_3_id: ef.qa_apoyo_3_id || undefined,
      })
      if (result.success) {
        setRows(prev => prev.map(r => r.id === id ? result.data : r))
        cancelEdit()
        toast.success('Requerimiento actualizado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const TIPOS_REQ = (['PRY_REQUERIMIENTOS', 'PRY_INCIDENTES', 'PRY_ATENCIONES'] as TipoRequerimientoEnum[])
    .map(v => ({ value: v, label: TIPO_REQUERIMIENTO_LABELS[v] }))
  const ANALISTAS_OPTS = analistas.map(a => ({
    value: a.id,
    label: a.full_name + (a.role === 'SUPERVISOR' ? ' [SUP]' : ''),
  }))
  const APLIC_OPTS = aplicativos.map(a => ({ value: a.codigo, label: `${a.codigo} — ${a.nombre}` }))

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Sin requerimientos registrados"
        description="Crea el primer requerimiento desde el botón 'Nuevo'."
      />
    )
  }

  const TH = 'px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400 whitespace-nowrap bg-slate-50 sticky top-0 z-10'
  const TD = 'px-3 py-1.5 text-xs text-slate-700 whitespace-nowrap'
  const STICKY_L = 'sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]'
  const STICKY_R = 'sticky right-0 z-10 bg-white shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]'
  const STICKY_LH = 'sticky top-0 left-0 z-30 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]'
  const STICKY_RH = 'sticky top-0 right-0 z-30 bg-slate-50 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]'

  return (
    <>
      <div className="overflow-auto scrollbar-thick h-full">
        <table className="w-max min-w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={`${TH} ${STICKY_LH} min-w-[160px]`}>Nro. Req</th>
              <th className={`${TH} min-w-[200px]`}>Título</th>
              <th className={`${TH} min-w-[170px]`}>Aplicativo</th>
              <th className={`${TH} min-w-[140px]`}>Tipo</th>
              <th className={`${TH} min-w-[140px]`}>ATI</th>
              <th className={`${TH} min-w-[150px]`}>QA Resp.</th>
              <th className={`${TH} min-w-[140px]`}>QA Apoyo 1</th>
              <th className={`${TH} min-w-[140px]`}>QA Apoyo 2</th>
              <th className={`${TH} min-w-[140px]`}>QA Apoyo 3</th>
              <th className={`${TH} min-w-[180px]`}>Descripción</th>
              <th className={`${TH} min-w-[110px]`}>Iteraciones</th>
              <th className={`${TH} min-w-[170px]`}>Último Estado QA</th>
              <th className={`${TH} min-w-[80px]`}>Avance</th>
              {canEdit && <th className={`${TH} ${STICKY_RH} min-w-[70px]`} />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => {
              const ed = editingId === r.id && ef !== null
              const iters = r.iterations ?? []
              const lastIter = iters[iters.length - 1]

              return (
                <tr key={r.id} className={`group ${ed ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}>

                  {/* Nro. Req */}
                  <td className={`${TD} ${STICKY_L} ${ed ? 'bg-blue-50/40' : 'group-hover:bg-slate-50/60'}`}>
                    <button
                      onClick={() => !ed && setDetailReq(r)}
                      className="font-mono text-xs text-primary hover:underline font-semibold text-left"
                    >
                      {r.codigo_requerimiento}
                    </button>
                  </td>

                  {/* Título */}
                  <td className={TD}>
                    {ed
                      ? <Txt v={ef.titulo} set={s('titulo')} ph="Título…" />
                      : <span className="max-w-[190px] block truncate">{r.titulo || '—'}</span>}
                  </td>

                  {/* Aplicativo */}
                  <td className={TD}>
                    {ed
                      ? <Sel v={ef.aplicativo} set={s('aplicativo')} opts={APLIC_OPTS} />
                      : <span className="text-muted-foreground">{apLabelShort(r.aplicativo, aplicativos)}</span>}
                  </td>

                  {/* Tipo */}
                  <td className={TD}>
                    {ed
                      ? <Sel v={ef.tipo_requerimiento} set={s('tipo_requerimiento')} opts={TIPOS_REQ} />
                      : <span className="text-muted-foreground">{r.tipo_requerimiento ? TIPO_REQUERIMIENTO_LABELS[r.tipo_requerimiento] : '—'}</span>}
                  </td>

                  {/* ATI */}
                  <td className={TD}>
                    {ed
                      ? <Txt v={ef.ati_responsable} set={s('ati_responsable')} ph="ATI…" />
                      : <span className="text-muted-foreground">{r.ati_responsable || '—'}</span>}
                  </td>

                  {/* QA Responsable */}
                  <td className={TD}>
                    {ed
                      ? <Sel v={ef.responsable_qa_id} set={s('responsable_qa_id')} opts={ANALISTAS_OPTS} />
                      : r.responsable_qa?.full_name ?? '—'}
                  </td>

                  {/* QA Apoyos */}
                  {(['qa_apoyo_1_id', 'qa_apoyo_2_id', 'qa_apoyo_3_id'] as const).map((field, i) => {
                    const names = [r.qa_apoyo_1?.full_name, r.qa_apoyo_2?.full_name, r.qa_apoyo_3?.full_name]
                    return (
                      <td key={field} className={TD}>
                        {ed
                          ? <Sel v={ef[field]} set={s(field)} opts={ANALISTAS_OPTS} />
                          : <span className="text-muted-foreground">{names[i] ?? '—'}</span>}
                      </td>
                    )
                  })}

                  {/* Descripción */}
                  <td className={TD}>
                    {ed
                      ? <Txt v={ef.descripcion} set={s('descripcion')} ph="Descripción…" />
                      : <span className="max-w-[170px] block truncate text-muted-foreground">{r.descripcion || '—'}</span>}
                  </td>

                  {/* Iteraciones — círculos */}
                  <td className={`${TD} text-center`}>
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {iters.map(it => (
                        <button
                          key={it.id}
                          onClick={() => setDetailReq(r)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 hover:bg-blue-200 transition-colors"
                          title={`Iter. ${it.iteracion} — ${it.estado_qa}`}
                        >
                          {it.iteracion}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Último Estado QA */}
                  <td className={TD}>
                    {lastIter ? <StatusBadge estado={lastIter.estado_qa as any} /> : <span className="text-muted-foreground">—</span>}
                  </td>

                  {/* Avance último iter */}
                  <td className={`${TD} text-center`}>
                    {lastIter ? <span className="font-medium">{lastIter.avance_porcentaje}%</span> : '—'}
                  </td>

                  {/* Acciones */}
                  {canEdit && (
                    <td className={`${TD} ${STICKY_R} ${ed ? 'bg-blue-50/40' : 'bg-white group-hover:bg-slate-50/60'}`}>
                      {ed ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleSave(r.id)} disabled={isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(r)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-blue-50 hover:text-blue-600">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setPendingDeleteId(r.id)} disabled={isDeleting}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog de detalle con iteraciones */}
      {detailReq && (
        <RequirementDetailDialog
          requirement={detailReq}
          aplicativos={aplicativos}
          analistas={analistas}
          canEdit={canEdit}
          open={!!detailReq}
          onOpenChange={(open) => { if (!open) setDetailReq(null) }}
          onUpdated={(updated) => setRows(prev => prev.map(r => r.id === updated.id ? updated : r))}
        />
      )}

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este requerimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el requerimiento y todas sus iteraciones. Esta acción no se puede deshacer.
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
    </>
  )
}
