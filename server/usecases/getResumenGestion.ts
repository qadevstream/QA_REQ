import { createClient } from '@/lib/supabase/server'
import { ESTADOS_RESUMEN } from '@/lib/resumenGestion'
export type { EstadoResumenKey, ResumenGestionData } from '@/lib/resumenGestion'
import type { EstadoResumenKey } from '@/lib/resumenGestion'

// Dado un año y mes (0-based), devuelve el rango del período:
// inicio = 03/MM/YYYY, fin = 02/MM+1/YYYY
export function calcPeriodo(year: number, month: number) {
  const inicio = new Date(year, month, 3)
  const fin    = new Date(year, month + 1, 2)
  // Fin a las 23:59:59 para incluir todo el día
  fin.setHours(23, 59, 59, 999)
  return { inicio, fin }
}

export function periodoLabel(year: number, month: number) {
  const { inicio, fin } = calcPeriodo(year, month)
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString('es-PE', opts)
  const nombreMes = fmt(inicio, { month: 'long' })
  const rango = `${fmt(inicio, { day: '2-digit', month: 'short' })} – ${fmt(fin, { day: '2-digit', month: 'short' })} ${year}`
  return { nombreMes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), rango, year, month }
}

// Lista de períodos disponibles: últimos 12 meses + actual
export function listaPeriodos() {
  const ahora = new Date()
  const periodos = []
  for (let i = 0; i <= 11; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    periodos.push(periodoLabel(d.getFullYear(), d.getMonth()))
  }
  return periodos
}

export async function getResumenGestion(year?: number, month?: number) {
  const supabase = await createClient()

  const ahora = new Date()
  const y = year  ?? ahora.getFullYear()
  const m = month ?? ahora.getMonth()

  const { inicio, fin } = calcPeriodo(y, m)

  // Filtramos por fecha_asignacion dentro del período (si existe), sino por created_at
  let query = supabase
    .from('requirement_iterations')
    .select(`
      estado_qa, fecha_asignacion, created_at,
      requirement:requirements!requirement_iterations_requirement_id_fkey(aplicativo)
    `)
    .gte('created_at', inicio.toISOString())
    .lte('created_at', fin.toISOString())

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)

  const { data: catalogo } = await supabase
    .from('aplicativos_catalogo')
    .select('codigo, nombre')
    .eq('activo', true)

  const nombreMap = new Map<string, string>(
    (catalogo ?? []).map((a) => [a.codigo, a.nombre])
  )

  const estadoKeys = ESTADOS_RESUMEN.map((e) => e.key)
  const emptyByEstado = () =>
    Object.fromEntries(estadoKeys.map((k) => [k, 0])) as Record<EstadoResumenKey, number>

  const globalPorEstado = emptyByEstado()
  const appMap = new Map<string, Record<EstadoResumenKey, number>>()

  for (const row of rows ?? []) {
    const req = Array.isArray(row.requirement) ? row.requirement[0] : row.requirement
    const ap  = (req as any)?.aplicativo as string | null
    const estado = row.estado_qa as EstadoResumenKey
    if (!estadoKeys.includes(estado)) continue

    globalPorEstado[estado]++
    if (ap) {
      if (!appMap.has(ap)) appMap.set(ap, emptyByEstado())
      appMap.get(ap)![estado]++
    }
  }

  const total = estadoKeys.reduce((s, k) => s + globalPorEstado[k], 0)

  const porAplicativo = Array.from(appMap.entries())
    .map(([codigo, porEstado]) => ({
      codigo,
      nombre: nombreMap.get(codigo) ?? codigo,
      porEstado,
      total: estadoKeys.reduce((s, k) => s + porEstado[k], 0),
    }))
    .sort((a, b) => b.total - a.total)

  const labels = periodoLabel(y, m)

  return {
    periodo: labels.rango,
    nombreMes: labels.nombreMes,
    year: y,
    month: m,
    total,
    porEstado: globalPorEstado,
    porAplicativo,
  }
}
