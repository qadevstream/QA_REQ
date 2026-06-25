'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateIterationAction } from '@/server/actions/requirements'
import type { RequirementIteration } from '@/types/domain.types'

interface ObservationEditorProps {
  iteration: RequirementIteration
  onUpdated?: (iter: RequirementIteration) => void
}

export function ObservationEditor({ iteration, onUpdated }: ObservationEditorProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(iteration.observaciones_estado ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateIterationAction(iteration.id, { observaciones_estado: text })
      if (result.success) {
        toast.success('Observaciones guardadas.')
        setEditing(false)
        onUpdated?.(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="min-h-[60px] rounded-md border border-dashed border-muted-foreground/30 p-3 text-sm text-muted-foreground">
          {text || 'Sin observaciones registradas.'}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
          <Edit2 className="h-3.5 w-3.5" />
          Editar observaciones
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribir observaciones..." rows={4} autoFocus />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando...</> : <><Save className="h-3.5 w-3.5" />Guardar</>}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setText(iteration.observaciones_estado ?? ''); setEditing(false) }}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
