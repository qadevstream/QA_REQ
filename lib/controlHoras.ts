// ─────────────────────────────────────────────────────────────────────────────
// Control de Horas — configuración de METAS y paleta.
// ⚠️ Los valores de meta son PLACEHOLDERS de la maqueta. Ajustar cuando se
//    confirmen las reglas de negocio (meta mensual/diaria por analista, días
//    hábiles). Centralizados aquí para tunear fácil sin tocar la UI.
// ─────────────────────────────────────────────────────────────────────────────

export const META_CONFIG = {
  /** Meta de horas por analista al mes. */
  mensualPorAnalista: 180,
  /** Meta de horas por analista al día (para "horas extra" y "real vs meta"). */
  diariaPorAnalista: 8,
  /** Días hábiles del período (para la proyección de cierre). */
  diasHabiles: 22,
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
