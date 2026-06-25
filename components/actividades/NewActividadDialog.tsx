'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createActividadAction } from '@/server/actions/actividades'
import { ACTIVIDAD_PRIORIDAD_LABELS, ACTIVIDAD_ESTADO_LABELS } from '@/lib/constants'
import type { Actividad, ActividadEstadoEnum, AplicativoCatalogo, Profile } from '@/types/domain.types'
import type { RequirementSummary } from '@/server/repositories/requirements.repository'

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}
        className="w-full appearance-none rounded-md border border-input bg-white px-3 py-2 pr-8 text-sm
          outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  )
}

interface NewActividadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEstado: ActividadEstadoEnum
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
  requirements: RequirementSummary[]
  onCreated: (actividad: Actividad) => void
}

const EMPTY = {
  requirementId: '',
  tck: '',
  aplicativo: '',
  atiResponsable: '',
  qaAsignadoId: '',
  fechaCompromiso: '',
  prioridad: 'MEDIA' as 'URGENTE' | 'IMPORTANTE' | 'MEDIA' | 'BAJA',
}

export function NewActividadDialog({
  open, onOpenChange, defaultEstado, analistas, aplicativos, requirements, onCreated,
}: NewActividadDialogProps) {
  const [form, setForm] = useState(EMPTY)
  const [isPending, startTransition] = useTransition()

  function reset() { setForm(EMPTY) }

  function handleSelectRequirement(id: string) {
    const req = requirements.find((r) => r.id === id)
    if (!req) {
      setForm(EMPTY)
      return
    }
    setForm({
      requirementId: id,
      tck: req.codigo_requerimiento,
      aplicativo: req.aplicativo ?? '',
      atiResponsable: req.ati_responsable ?? '',
      qaAsignadoId: req.responsable_qa_id ?? '',
      fechaCompromiso: '',
      prioridad: 'MEDIA',
    })
  }

  function handleSubmit() {
    if (!form.tck.trim()) {
      toast.error('Selecciona un requerimiento.')
      return
    }
    startTransition(async () => {
      const result = await createActividadAction({
        tck: form.tck.trim(),
        aplicativo: form.aplicativo || undefined,
        estado: defaultEstado,
        ati_responsable: form.atiResponsable || undefined,
        qa_asignado_id: form.qaAsignadoId || undefined,
        fecha_compromiso: form.fechaCompromiso || undefined,
        prioridad: form.prioridad,
      })
      if (result.success) {
        toast.success(result.message ?? 'Tarea creada.')
        onCreated(result.data)
        reset()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva actividad — {ACTIVIDAD_ESTADO_LABELS[defaultEstado]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropdown de requerimientos */}
          <div>
            <Label>Requerimiento (TCK) *</Label>
            <div className="mt-1.5">
              <Select value={form.requirementId} onChange={(e) => handleSelectRequirement(e.target.value)}>
                <option value="">— Seleccionar requerimiento —</option>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo_requerimiento}{r.titulo ? ` — ${r.titulo}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Campos auto-rellenados (editables) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Aplicativo</Label>
              <div className="mt-1.5">
                <Select value={form.aplicativo} onChange={(e) => setForm(p => ({ ...p, aplicativo: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {aplicativos.map((a) => (
                    <option key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label>Prioridad</Label>
              <div className="mt-1.5">
                <Select value={form.prioridad} onChange={(e) => setForm(p => ({ ...p, prioridad: e.target.value as typeof form.prioridad }))}>
                  {Object.entries(ACTIVIDAD_PRIORIDAD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ATI Responsable</Label>
              <Input
                value={form.atiResponsable}
                onChange={(e) => setForm(p => ({ ...p, atiResponsable: e.target.value }))}
                placeholder="Nombre"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>QA Asignado</Label>
              <div className="mt-1.5">
                <Select value={form.qaAsignadoId} onChange={(e) => setForm(p => ({ ...p, qaAsignadoId: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {analistas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}{a.role === 'SUPERVISOR' ? ' [SUP]' : a.role === 'CLIENTE' ? ' [CLI]' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label>Fecha Compromiso</Label>
            <Input
              type="date"
              value={form.fechaCompromiso}
              onChange={(e) => setForm(p => ({ ...p, fechaCompromiso: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Creando…' : 'Crear actividad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
