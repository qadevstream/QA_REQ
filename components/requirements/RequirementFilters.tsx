'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ESTADO_QA_LABELS, ESTADO_QA_ORDER } from '@/lib/constants'
import type { Profile, AplicativoCatalogo } from '@/types/domain.types'
import type { EstadoQaEnum } from '@/types/database.types'

interface RequirementFiltersProps {
  analistas: Profile[]
  aplicativos?: AplicativoCatalogo[]
  estados?: EstadoQaEnum[]
}

export function RequirementFilters({ analistas, aplicativos = [], estados }: RequirementFiltersProps) {
  // Solo los estados en uso (si no se pasan, se muestran todos), en el orden del flujo.
  const estadosMostrar = ESTADO_QA_ORDER.filter((e) => (estados ?? ESTADO_QA_ORDER).includes(e))
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'ALL') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título o código…"
          className="pl-8"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => setParam('search', e.target.value)}
        />
      </div>

      <Select defaultValue={searchParams.get('estado_qa') ?? 'ALL'} onValueChange={(v) => setParam('estado_qa', v)}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Estado QA" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          {estadosMostrar.map((value) => (
            <SelectItem key={value} value={value}>{ESTADO_QA_LABELS[value]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get('aplicativo') ?? 'ALL'} onValueChange={(v) => setParam('aplicativo', v)}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Aplicativo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los aplicativos</SelectItem>
          {aplicativos.map((a) => (
            <SelectItem key={a.codigo} value={a.codigo}>{a.codigo} — {a.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {analistas.length > 0 && (
        <Select defaultValue={searchParams.get('responsable_qa_id') ?? 'ALL'} onValueChange={(v) => setParam('responsable_qa_id', v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="QA Responsable" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los QA</SelectItem>
            {analistas.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
