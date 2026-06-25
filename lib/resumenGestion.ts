export const ESTADOS_RESUMEN = [
  { key: 'PEND_ASIGNACION',     num: 1, label: 'Pend. Asignación',   color: '#F59E0B' },
  { key: 'EN_ESTIMACION',       num: 2, label: 'En Estimación',       color: '#60A5FA' },
  { key: 'PEND_APROB_ATI',     num: 3, label: 'Pend. Aprob ATI',     color: '#F97316' },
  { key: 'EN_PRUEBAS_QA',      num: 4, label: 'En Pruebas QA',       color: '#6366F1' },
  { key: 'EN_PRUEBAS_USUARIO', num: 5, label: 'En Pruebas Usuario',  color: '#10B981' },
  { key: 'OBSERVADO_BLOQUEADO',num: 6, label: 'Observado/Bloqueado', color: '#EF4444' },
  { key: 'TERMINADO',           num: 7, label: 'Terminado',            color: '#22C55E' },
] as const

export type EstadoResumenKey = typeof ESTADOS_RESUMEN[number]['key']

export interface ResumenGestionData {
  periodo: string
  nombreMes: string
  year: number
  month: number
  total: number
  porEstado: Record<EstadoResumenKey, number>
  porAplicativo: {
    codigo: string
    nombre: string
    porEstado: Record<EstadoResumenKey, number>
    total: number
  }[]
}
