import type { AplicativoCatalogo } from '@/types/domain.types'

export function apLabel(
  codigo: string | null | undefined,
  list: AplicativoCatalogo[]
): string {
  if (!codigo) return '—'
  const found = list.find((a) => a.codigo === codigo)
  return found ? `${found.codigo} — ${found.nombre}` : codigo
}

export function apLabelShort(
  codigo: string | null | undefined,
  list: AplicativoCatalogo[]
): string {
  if (!codigo) return '—'
  return list.find((a) => a.codigo === codigo)?.nombre ?? codigo
}

export function apColor(
  codigo: string | null | undefined,
  list: AplicativoCatalogo[]
): string {
  if (!codigo) return '#94A3B8'
  return list.find((a) => a.codigo === codigo)?.color ?? '#94A3B8'
}

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function compact(s: string) {
  return norm(s).replace(/\s+/g, '')
}

export function resolveAplicativoByCodigo(
  value: string | undefined,
  list: AplicativoCatalogo[]
): string | undefined {
  if (!value) return undefined
  const v = norm(value)
  const byCode = list.find((a) => norm(a.codigo) === v)
  if (byCode) return byCode.codigo
  const byName = list.find(
    (a) =>
      norm(a.nombre) === v ||
      v.includes(norm(a.nombre)) ||
      norm(a.nombre).includes(v) ||
      v.includes(norm(a.codigo)) ||
      compact(a.nombre).includes(compact(value)) ||
      compact(value).includes(compact(a.codigo))
  )
  return byName?.codigo
}
