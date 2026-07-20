'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ToggleLeft, ToggleRight, CalendarOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  createFeriadoAction,
  updateFeriadoAction,
  deleteFeriadoAction,
} from '@/server/actions/mantenimiento'
import type { CatFeriado } from '@/types/domain.types'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// El día de la semana define si el feriado descuenta o no: uno que cae
// sábado o domingo no reduce la meta, porque no había jornada.
function diaSemana(fecha: string): { nombre: string; esFinDeSemana: boolean } {
  const d = new Date(`${fecha}T00:00:00`)
  const dow = d.getDay()
  return { nombre: DIAS[dow], esFinDeSemana: dow === 0 || dow === 6 }
}

function anio(fecha: string): string {
  return fecha.slice(0, 4)
}

interface Props {
  initialItems: CatFeriado[]
}

export function FeriadosManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [fecha, setFecha] = useState('')
  const [nombre, setNombre] = useState('')
  const [medioDia, setMedioDia] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Agrupados por año, del más reciente al más antiguo.
  const porAnio = useMemo(() => {
    const map = new Map<string, CatFeriado[]>()
    for (const f of [...items].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
      const y = anio(f.fecha)
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(f)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  const activos = items.filter((i) => i.activo)
  const queDescuentan = activos.filter((i) => !diaSemana(i.fecha).esFinDeSemana)

  function handleAdd() {
    if (!fecha) { toast.error('Selecciona la fecha del feriado.'); return }
    if (!nombre.trim()) { toast.error('El nombre es obligatorio.'); return }

    startTransition(async () => {
      const result = await createFeriadoAction({
        fecha, nombre: nombre.trim(), horas: medioDia ? 4 : 8,
      })
      if (result.success) {
        setItems((prev) => [...prev, result.data])
        setFecha('')
        setNombre('')
        setMedioDia(false)
        toast.success(result.message ?? 'Feriado agregado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleToggle(item: CatFeriado) {
    startTransition(async () => {
      const result = await updateFeriadoAction(item.fecha, { activo: !item.activo })
      if (result.success) {
        setItems((prev) => prev.map((i) => i.fecha === item.fecha ? result.data : i))
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete(fechaDel: string) {
    startTransition(async () => {
      const result = await deleteFeriadoAction(fechaDel)
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.fecha !== fechaDel))
        toast.success('Feriado eliminado.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Catálogo de Feriados</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activos.length} activos · {queDescuentan.length} reducen la meta de horas
          </p>
        </div>
        <CalendarOff className="h-4 w-4 text-slate-300" />
      </div>

      <div className="px-5 py-2.5 border-b border-slate-100 bg-amber-50/50">
        <p className="text-[11px] text-amber-800">
          El feriado descuenta del período que <strong>contiene su fecha</strong>, no del mes de su nombre.
          Los períodos van del día 3 al 2 del mes siguiente: por eso el 01 de enero reduce la meta de
          &ldquo;Diciembre&rdquo;, no la de &ldquo;Enero&rdquo;.
        </p>
      </div>

      {/* Alta */}
      <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/30">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Agregar feriado</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-40 text-sm"
          />
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Día de la Independencia"
            className="flex-1 min-w-[180px] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={medioDia}
              onChange={(e) => setMedioDia(e.target.checked)}
              className="rounded border-slate-300"
            />
            Media jornada
          </label>
          <Button onClick={handleAdd} disabled={isPending} size="sm">
            <Plus className="h-4 w-4 mr-1" />Agregar
          </Button>
        </div>
        {fecha && diaSemana(fecha).esFinDeSemana && (
          <p className="mt-2 text-[11px] text-amber-700">
            Ojo: ese día cae {diaSemana(fecha).nombre.toLowerCase()}. Se puede registrar,
            pero no reducirá la meta porque no era día laboral.
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Día</th>
              <th className="px-4 py-2 text-left">Feriado</th>
              <th className="px-4 py-2 text-center w-24">Descuenta</th>
              <th className="px-4 py-2 text-center w-20">Estado</th>
              <th className="px-4 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {porAnio.map(([y, feriados]) => (
              <Fragment key={y}>
                <tr className="bg-slate-50/80">
                  <td colSpan={6} className="px-4 py-1.5 text-[11px] font-bold text-slate-500">
                    {y} · {feriados.filter((f) => f.activo && !diaSemana(f.fecha).esFinDeSemana).length} descuentan
                  </td>
                </tr>
                {feriados.map((item) => {
                  const dia = diaSemana(item.fecha)
                  const descuenta = item.activo && !dia.esFinDeSemana
                  return (
                    <tr key={item.fecha} className={`group hover:bg-slate-50/70 ${!item.activo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2 text-xs font-mono text-slate-700">{item.fecha}</td>
                      <td className={`px-4 py-2 text-xs ${dia.esFinDeSemana ? 'text-slate-400' : 'text-slate-600'}`}>
                        {dia.nombre}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-800">{item.nombre}</td>
                      <td className="px-4 py-2 text-center text-xs">
                        {descuenta ? (
                          <span className="font-semibold text-slate-700">
                            {item.horas === 8 ? 'día' : `${item.horas} h`}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
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
                            onClick={() => handleDelete(item.fecha)}
                            disabled={isPending}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                  No hay feriados registrados. La meta de horas usará todos los días L–V del período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
