'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, RefreshCw } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ActividadCard } from './ActividadCard'
import { NewActividadDialog } from './NewActividadDialog'
import { ActividadDetailDialog } from './ActividadDetailDialog'
import { moveActividadAction } from '@/server/actions/actividades'
import { syncPlannerAction } from '@/server/actions/requirements'
import { ACTIVIDAD_ESTADO_ORDER, ACTIVIDAD_ESTADO_LABELS } from '@/lib/constants'
import type { Actividad, ActividadEstadoEnum, AplicativoCatalogo, Profile } from '@/types/domain.types'
import type { RequirementSummary } from '@/server/repositories/requirements.repository'

interface PendingMove {
  id: string
  tck: string
  from: ActividadEstadoEnum
  to: ActividadEstadoEnum
}

interface KanbanBoardProps {
  initialActividades: Actividad[]
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
  requirements: RequirementSummary[]
}

export function KanbanBoard({ initialActividades, analistas, aplicativos, requirements }: KanbanBoardProps) {
  const [actividades, setActividades] = useState(initialActividades)
  const [dialogEstado, setDialogEstado] = useState<ActividadEstadoEnum | null>(null)
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ActividadEstadoEnum | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [, startMove] = useTransition()
  const [isSyncing, startSync] = useTransition()
  const [terminadoExpanded, setTerminadoExpanded] = useState(false)

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, estado: ActividadEstadoEnum) {
    e.preventDefault()
    setDragOverColumn(null)
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return

    const current = actividades.find((a) => a.id === id)
    if (!current || current.estado === estado) return

    setPendingMove({ id, tck: current.tck, from: current.estado, to: estado })
  }

  function confirmMove() {
    if (!pendingMove) return
    const { id, from, to } = pendingMove
    setPendingMove(null)

    setActividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: to, dias_en_estado: 0 } : a))
    )

    startMove(async () => {
      const result = await moveActividadAction(id, to)
      if (!result.success) {
        toast.error(result.error)
        setActividades((prev) =>
          prev.map((a) => (a.id === id ? { ...a, estado: from } : a))
        )
      }
    })
  }

  function handleCreated(actividad: Actividad) {
    setActividades((prev) => [...prev, actividad])
  }

  function handleUpdated(actividad: Actividad) {
    setActividades((prev) => prev.map((a) => (a.id === actividad.id ? actividad : a)))
  }

  function handleDeleted(id: string) {
    setActividades((prev) => prev.filter((a) => a.id !== id))
  }

  function handleSync() {
    startSync(async () => {
      const result = await syncPlannerAction()
      if (result.success) {
        toast.success(result.message)
        // Reload the page to show new cards
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground text-sm mt-1">Tablero de seguimiento operativo (estilo Planner)</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Crear tarjetas para iteraciones sin actividad en el planner"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando…' : 'Sincronizar Planner'}
        </button>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-4 min-w-max">
          {ACTIVIDAD_ESTADO_ORDER.map((estado) => {
            const items = actividades
              .filter((a) => a.estado === estado)
              .sort((a, b) => a.posicion - b.posicion)
            const isTerminado = estado === 'TERMINADO'
            const visibleItems = isTerminado && !terminadoExpanded ? [] : items

            return (
              <div
                key={estado}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(estado) }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, estado)}
                className={`flex w-72 shrink-0 flex-col rounded-lg transition-colors ${
                  dragOverColumn === estado ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    {ACTIVIDAD_ESTADO_LABELS[estado]}
                  </h2>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>


                <div className="flex-1 space-y-2 overflow-y-auto pb-4">
                  {isTerminado && items.length > 0 && (
                    <button
                      onClick={() => setTerminadoExpanded((v) => !v)}
                      className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${terminadoExpanded ? '' : '-rotate-90'}`} />
                      Tareas completadas — {items.length}
                    </button>
                  )}
                  {visibleItems.map((actividad) => (
                    <ActividadCard
                      key={actividad.id}
                      actividad={actividad}
                      aplicativos={aplicativos}
                      onDragStart={handleDragStart}
                      onClick={() => setSelectedActividad(actividad)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {dialogEstado && (
        <NewActividadDialog
          open
          onOpenChange={(open) => !open && setDialogEstado(null)}
          defaultEstado={dialogEstado}
          analistas={analistas}
          aplicativos={aplicativos}
          requirements={requirements}
          onCreated={handleCreated}
        />
      )}

      {selectedActividad && (
        <ActividadDetailDialog
          actividad={selectedActividad}
          open
          onOpenChange={(open) => !open && setSelectedActividad(null)}
          analistas={analistas}
          aplicativos={aplicativos}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      <AlertDialog open={pendingMove !== null} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Mover esta tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove && (
                <>
                  <strong>{pendingMove.tck}</strong> pasará de{' '}
                  <strong>{ACTIVIDAD_ESTADO_LABELS[pendingMove.from]}</strong> a{' '}
                  <strong>{ACTIVIDAD_ESTADO_LABELS[pendingMove.to]}</strong>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMove}>Sí, mover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
