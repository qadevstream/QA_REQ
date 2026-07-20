// ─────────────────────────────────────────────────────────────────────────────
// Control de Horas — cálculo de METAS y paleta.
//
// La meta ya no es un número fijo: se deriva de los días hábiles reales del
// período, descontando feriados. Ver calcularMetaPeriodo() más abajo.
// ─────────────────────────────────────────────────────────────────────────────

import { PERIODOS } from '@/lib/constants'
import type { CatFeriado } from '@/types/domain.types'

export const META_CONFIG = {
  /** Jornada estándar por analista al día. Base de todo el cálculo. */
  diariaPorAnalista: 8,
} as const

/** Paleta categórica en familia azul del proyecto (para el donut de tipos). */
export const TIPO_PALETTE = [
  '#0184EF', '#003087', '#12B0C9', '#5AB0F5',
  '#0B5FA5', '#7DD3FC', '#1E40AF', '#38BDF8', '#64748B',
]

/** Umbrales de color para el % de cumplimiento (acento del KPI/semáforo). */
export function cumplimientoAccent(pct: number): 'danger' | 'warning' | 'success' {
  if (pct < 50) return 'danger'
  if (pct < 85) return 'warning'
  return 'success'
}

export interface MetaPeriodo {
  /** Lunes a viernes dentro del rango del período. */
  diasLaborables: number
  /** Días laborables que son feriado (no cuentan como hábiles). */
  diasFeriado: number
  /** diasLaborables − diasFeriado. */
  diasHabiles: number
  /** Meta de horas por analista para el período. */
  horasPorAnalista: number
  /** Feriados del período que efectivamente descuentan (cayeron L–V). */
  feriados: CatFeriado[]
}

const META_VACIA: MetaPeriodo = {
  diasLaborables: 0, diasFeriado: 0, diasHabiles: 0, horasPorAnalista: 0, feriados: [],
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Calcula la meta de horas de un período a partir de sus días hábiles reales.
 *
 * ⚠️ El período NO es un mes calendario: va del día 3 al día 2 del mes
 * siguiente (ver PERIODOS en lib/constants). Por eso el feriado se ubica por
 * el rango [from, to] que contiene su fecha y no por el mes de su nombre.
 * Ej.: el 01 Ene 2026 descuenta del período "Diciembre 2025", no de "Enero 2026".
 *
 * Los feriados que caen sábado o domingo se ignoran: no había jornada que
 * descontar, así que restarlos inflaría la reducción.
 */
export function calcularMetaPeriodo(
  periodo: string,
  feriados: CatFeriado[],
  horasPorDia: number = META_CONFIG.diariaPorAnalista
): MetaPeriodo {
  const rango = PERIODOS.find((p) => p.value === periodo)
  if (!rango) return META_VACIA

  // Indexa por fecha para no recorrer la lista completa por cada día.
  const porFecha = new Map(feriados.filter((f) => f.activo).map((f) => [f.fecha, f]))

  let diasLaborables = 0
  const delPeriodo: CatFeriado[] = []

  const cursor = new Date(`${rango.from}T00:00:00`)
  const fin = new Date(`${rango.to}T00:00:00`)
  while (cursor <= fin) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      diasLaborables++
      const feriado = porFecha.get(toISO(cursor))
      if (feriado) delPeriodo.push(feriado)
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Un feriado de media jornada descuenta 4 h, no un día entero: se convierte
  // a días equivalentes para que `diasHabiles` siga siendo comparable.
  const diasFeriado = delPeriodo.reduce((acc, f) => acc + Math.min(f.horas, horasPorDia) / horasPorDia, 0)
  const diasHabiles = diasLaborables - diasFeriado

  return {
    diasLaborables,
    diasFeriado,
    diasHabiles,
    horasPorAnalista: diasHabiles * horasPorDia,
    feriados: delPeriodo,
  }
}
