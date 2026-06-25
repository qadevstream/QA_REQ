'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  createAplicativoAction,
  updateAplicativoAction,
  deleteAplicativoAction,
} from '@/server/actions/mantenimiento'
import type { AplicativoCatalogo } from '@/types/domain.types'

interface Props {
  initialAplicativos: AplicativoCatalogo[]
}

const EMPTY = { codigo: '', nombre: '', color: '#0184EF', ati_responsable: '', correo: '', aplicativo_grupo: '' }

export function AplicativosCatalogoManager({ initialAplicativos }: Props) {
  const [aplicativos, setAplicativos] = useState(initialAplicativos)
  const [searchNombre, setSearchNombre] = useState('')
  const [searchAplicativo, setSearchAplicativo] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingCodigo, setEditingCodigo] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', color: '', ati_responsable: '', correo: '', aplicativo_grupo: '' })
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Código y nombre son obligatorios.')
      return
    }
    startTransition(async () => {
      const result = await createAplicativoAction({
        codigo: form.codigo,
        nombre: form.nombre,
        color: form.color,
        ati_responsable: form.ati_responsable || undefined,
        correo: form.correo || undefined,
        aplicativo_grupo: form.aplicativo_grupo || undefined,
      })
      if (result.success) {
        setAplicativos((prev) => [...prev, result.data])
        setForm(EMPTY)
        setAddOpen(false)
        toast.success(result.message ?? 'Aplicativo creado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function startEdit(a: AplicativoCatalogo) {
    setEditingCodigo(a.codigo)
    setEditForm({ nombre: a.nombre, color: a.color, ati_responsable: a.ati_responsable ?? '', correo: a.correo ?? '', aplicativo_grupo: a.aplicativo_grupo ?? '' })
  }

  function handleSaveEdit(codigo: string) {
    startTransition(async () => {
      const result = await updateAplicativoAction(codigo, {
        nombre: editForm.nombre,
        color: editForm.color,
        ati_responsable: editForm.ati_responsable || null,
        correo: editForm.correo || null,
        aplicativo_grupo: editForm.aplicativo_grupo || null,
      })
      if (result.success) {
        setAplicativos((prev) => prev.map((a) => a.codigo === codigo ? result.data : a))
        setEditingCodigo(null)
        toast.success('Aplicativo actualizado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleToggleActivo(a: AplicativoCatalogo) {
    startTransition(async () => {
      const result = await updateAplicativoAction(a.codigo, { activo: !a.activo })
      if (result.success) {
        setAplicativos((prev) => prev.map((x) => x.codigo === a.codigo ? result.data : x))
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(codigo: string) {
    startTransition(async () => {
      const result = await deleteAplicativoAction(codigo)
      if (result.success) {
        setAplicativos((prev) => prev.filter((a) => a.codigo !== codigo))
        toast.success('Aplicativo eliminado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  const activos = aplicativos.filter((a) => a.activo)
  const inactivos = aplicativos.filter((a) => !a.activo)

  const gruposUnicos = Array.from(new Set(aplicativos.map((a) => a.aplicativo_grupo).filter(Boolean))).sort() as string[]

  const filtered = aplicativos.filter((a) => {
    const matchNombre = !searchNombre || a.nombre.toLowerCase().includes(searchNombre.toLowerCase()) || a.codigo.toLowerCase().includes(searchNombre.toLowerCase())
    const matchAplicativo = !searchAplicativo || a.aplicativo_grupo === searchAplicativo
    return matchNombre && matchAplicativo
  })

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Matriz de Aplicaciones</h2>
            <p className="text-xs text-slate-400 mt-0.5">{activos.length} activos · {inactivos.length} inactivos</p>
          </div>
          <Button size="sm" onClick={() => { setForm(EMPTY); setAddOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />Nuevo Aplicativo
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={searchAplicativo}
            onChange={(e) => setSearchAplicativo(e.target.value)}
            className="text-xs rounded-md border border-slate-200 px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          >
            <option value="">Todos los aplicativos</option>
            {gruposUnicos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {(searchNombre || searchAplicativo) && (
            <button
              onClick={() => { setSearchNombre(''); setSearchAplicativo('') }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Limpiar
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 text-left w-28">Código</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left" style={{width:'220px'}}>Aplicativo</th>
                <th className="px-4 py-2 text-left" style={{width:'220px'}}>ATI Responsable</th>
                <th className="px-4 py-2 text-left" style={{width:'220px'}}>Correo</th>
                <th className="px-4 py-2 text-center w-14">Color</th>
                <th className="px-4 py-2 text-center w-16">Estado</th>
                <th className="px-4 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.codigo} className={`group hover:bg-slate-50/70 ${!a.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-slate-700">{a.codigo}</td>
                  <td className="px-4 py-2">
                    {editingCodigo === a.codigo ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editForm.nombre}
                          onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                          className="text-sm h-7 py-0"
                          autoFocus
                        />
                        <input
                          type="color"
                          value={editForm.color}
                          onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                          className="h-7 w-8 cursor-pointer rounded border border-slate-200 p-0.5"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-800">{a.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingCodigo === a.codigo ? (
                      <Input
                        value={editForm.aplicativo_grupo}
                        onChange={(e) => setEditForm((p) => ({ ...p, aplicativo_grupo: e.target.value }))}
                        className="text-xs h-7 py-0"
                        placeholder="Ej: [NO SAP] Sistema"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">{a.aplicativo_grupo ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingCodigo === a.codigo ? (
                      <Input
                        value={editForm.ati_responsable}
                        onChange={(e) => setEditForm((p) => ({ ...p, ati_responsable: e.target.value }))}
                        className="text-xs h-7 py-0"
                        placeholder="ATI Responsable"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">{a.ati_responsable ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingCodigo === a.codigo ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editForm.correo}
                          onChange={(e) => setEditForm((p) => ({ ...p, correo: e.target.value }))}
                          className="text-xs h-7 py-0"
                          placeholder="correo@ejemplo.com"
                        />
                        <button onClick={() => handleSaveEdit(a.codigo)} disabled={isPending}
                          className="text-emerald-600 hover:text-emerald-700 shrink-0">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingCodigo(null)}
                          className="text-slate-400 hover:text-slate-600 shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">{a.correo ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className="inline-block h-5 w-5 rounded-full border border-slate-200"
                      style={{ backgroundColor: a.color }}
                      title={a.color}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleToggleActivo(a)}
                      disabled={isPending}
                      title={a.activo ? 'Desactivar' : 'Activar'}
                      className={`transition-colors ${a.activo ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      {a.activo
                        ? <ToggleRight className="h-5 w-5" />
                        : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingCodigo !== a.codigo && (
                        <button onClick={() => startEdit(a)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(a.codigo)} disabled={isPending}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Nuevo Aplicativo */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setForm(EMPTY) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Aplicativo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Código *</label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ej: SAP-BP"
                className="font-mono text-xs uppercase"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Nombre *</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del sistema"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Aplicativo</label>
              <Input
                value={form.aplicativo_grupo}
                onChange={(e) => setForm((p) => ({ ...p, aplicativo_grupo: e.target.value }))}
                placeholder="Ej: [NO SAP] Sistema"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">ATI Responsable</label>
              <Input
                value={form.ati_responsable}
                onChange={(e) => setForm((p) => ({ ...p, ati_responsable: e.target.value }))}
                placeholder="Nombre del responsable"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Correo</label>
              <Input
                value={form.correo}
                onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                placeholder="correo@cofide.com.pe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={isPending}>
              <Plus className="h-4 w-4 mr-1" />Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
