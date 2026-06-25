'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  createCatTipoTareaAction,
  updateCatTipoTareaAction,
  deleteCatTipoTareaAction,
} from '@/server/actions/mantenimiento'
import type { CatTipoTarea } from '@/types/domain.types'

interface Props {
  initialItems: CatTipoTarea[]
}

export function CatTipoTareaManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [newVal, setNewVal] = useState('')
  const [isPending, startTransition] = useTransition()

  const activos = items.filter((i) => i.activo)
  const inactivos = items.filter((i) => !i.activo)

  function handleAdd() {
    if (!newVal.trim()) { toast.error('El nombre es obligatorio.'); return }
    startTransition(async () => {
      const result = await createCatTipoTareaAction({ tipo_tarea: newVal.trim() })
      if (result.success) {
        setItems((prev) => [...prev, result.data])
        setNewVal('')
        toast.success(result.message ?? 'Tipo de tarea creado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleToggle(item: CatTipoTarea) {
    startTransition(async () => {
      const result = await updateCatTipoTareaAction(item.tipo_tarea, { activo: !item.activo })
      if (result.success) {
        setItems((prev) => prev.map((i) => i.tipo_tarea === item.tipo_tarea ? result.data : i))
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(tipo_tarea: string) {
    startTransition(async () => {
      const result = await deleteCatTipoTareaAction(tipo_tarea)
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.tipo_tarea !== tipo_tarea))
        toast.success('Tipo de tarea eliminado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Catálogo de Tipos de Tarea</h2>
          <p className="text-xs text-slate-400 mt-0.5">{activos.length} activos · {inactivos.length} inactivos</p>
        </div>
      </div>

      {/* Alta */}
      <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/30">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Agregar tipo de tarea</p>
        <div className="flex items-center gap-2">
          <Input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="Ej: [GSTI] Nuevo Tipo"
            className="flex-1 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={isPending} size="sm">
            <Plus className="h-4 w-4 mr-1" />Agregar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2 text-left">Tipo de Tarea</th>
              <th className="px-4 py-2 text-center w-20">Estado</th>
              <th className="px-4 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.tipo_tarea} className={`group hover:bg-slate-50/70 ${!item.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2 text-xs text-slate-800">{item.tipo_tarea}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={isPending}
                    title={item.activo ? 'Desactivar' : 'Activar'}
                    className={`transition-colors ${item.activo ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    {item.activo ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(item.tipo_tarea)}
                      disabled={isPending}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
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
    </Card>
  )
}
