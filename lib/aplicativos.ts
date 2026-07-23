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
  // Quita etiquetas entre corchetes del valor cargado, p.ej.
  // "[NO SAP] Fondo Crecer" → "Fondo Crecer", para que el match por nombre
  // no se rompa por el prefijo.
  const clean = value.replace(/\[[^\]]*\]/g, ' ').trim()
  if (!clean) return undefined
  const v = norm(clean)
  // El código SOLO matchea de forma exacta. Nunca por subcadena: un código
  // corto como "NDOC" vive dentro de "foNDOCrecer" y daría un falso positivo
  // (así "[NO SAP] Fondo Crecer" terminaba resolviendo a "Solución NetDocuments").
  const byCode = list.find((a) => norm(a.codigo) === v)
  if (byCode) return byCode.codigo
  const byName = list.find(
    (a) =>
      norm(a.nombre) === v ||
      v.includes(norm(a.nombre)) ||
      norm(a.nombre).includes(v) ||
      compact(a.nombre).includes(compact(clean))
  )
  return byName?.codigo
}
