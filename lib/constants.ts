import type {
  ActividadEstadoEnum,
  ActividadPrioridadEnum,
  ActividadProgresoEnum,
  CargoEnum,
  EstadoQaEnum,
  EstadoReqEnum,
  TipoRequerimientoEnum,
  TipoTareaEnum,
} from '@/types/database.types'

export const TIPO_REQUERIMIENTO_LABELS: Record<TipoRequerimientoEnum, string> = {
  PRY_REQUERIMIENTOS: '[PRY] Requerimientos',
  PRY_INCIDENTES: '[PRY] Incidentes',
  PRY_ATENCIONES: '[PRY] Atenciones',
}

export const ESTADO_QA_LABELS: Record<EstadoQaEnum, string> = {
  PEND_ASIGNACION: 'Pend. Asignación',
  EN_ESTIMACION: 'En Estimación',
  PEND_APROB_ATI: 'Pend. Aprob ATI',
  EN_PRUEBAS_QA: 'En Pruebas QA',
  OBSERVADO_BLOQUEADO: 'Observado / Bloqueado',
  EN_PRUEBAS_USUARIO: 'En Pruebas de Usuario',
  TERMINADO: 'Terminado',
  CANCELADO: 'Cancelado',
}

export const ESTADO_REQ_LABELS: Record<EstadoReqEnum, string> = {
  PENDIENTE: 'Pendiente',
  EN_DESARROLLO: 'En Desarrollo',
  EN_QA: 'En QA',
  EN_UAT: 'En UAT',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  EN_PRODUCCION: 'En Producción',
  CERRADO: 'Cerrado',
}

export const CARGO_LABELS: Record<CargoEnum, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR_QA: 'Supervisor QA',
  ANALISTA_QA_SENIOR: 'Analista QA Senior',
  ANALISTA_QA: 'Analista QA',
  ANALISTA_QA_JUNIOR: 'Analista QA Junior',
  TESTER: 'Tester',
  EXT: 'Externo',
}

export const ESTADO_QA_ORDER: EstadoQaEnum[] = [
  'PEND_ASIGNACION',
  'EN_ESTIMACION',
  'PEND_APROB_ATI',
  'EN_PRUEBAS_QA',
  'OBSERVADO_BLOQUEADO',
  'EN_PRUEBAS_USUARIO',
  'TERMINADO',
  'CANCELADO',
]

// Estados del tablero Kanban de Actividades (estilo Planner)
export const ACTIVIDAD_ESTADO_LABELS: Record<ActividadEstadoEnum, string> = {
  PEND_ASIGNACION: 'Pend. Asignación',
  EN_ESTIMACION: 'En Estimación',
  PEND_APROB_ATI: 'Pend. Aprob ATI',
  EN_PRUEBAS_QA: 'En Pruebas QA',
  OBSERVADO_BLOQUEADO: 'Observado / Bloqueado',
  EN_PRUEBAS_USUARIO: 'En Pruebas de Usuario',
  TERMINADO: 'Terminado',
}

export const ACTIVIDAD_ESTADO_ORDER: ActividadEstadoEnum[] = [
  'PEND_ASIGNACION',
  'EN_ESTIMACION',
  'PEND_APROB_ATI',
  'EN_PRUEBAS_QA',
  'OBSERVADO_BLOQUEADO',
  'EN_PRUEBAS_USUARIO',
  'TERMINADO',
]

// Prioridad estilo Planner
export const ACTIVIDAD_PRIORIDAD_LABELS: Record<ActividadPrioridadEnum, string> = {
  URGENTE: 'Urgente',
  IMPORTANTE: 'Importante',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

export const ACTIVIDAD_PRIORIDAD_COLORS: Record<ActividadPrioridadEnum, string> = {
  URGENTE: '#EF4444',
  IMPORTANTE: '#F97316',
  MEDIA: '#22C55E',
  BAJA: '#64748B',
}

export const ACTIVIDAD_PRIORIDAD_SYMBOL: Record<ActividadPrioridadEnum, string> = {
  URGENTE: '🔔',
  IMPORTANTE: '❗',
  MEDIA: '🟢',
  BAJA: '⬇️',
}

// Sub-estado de avance de la tarjeta, estilo Planner
export const ACTIVIDAD_PROGRESO_LABELS: Record<ActividadProgresoEnum, string> = {
  NO_INICIADO: 'No iniciado',
  EN_CURSO: 'En curso',
  COMPLETADO: 'Completado',
}

export const ACTIVIDAD_PROGRESO_COLORS: Record<ActividadProgresoEnum, string> = {
  NO_INICIADO: '#94A3B8',
  EN_CURSO: '#0184EF',
  COMPLETADO: '#7C3AED',
}

export const CAMPO_MODIFICADO_LABELS: Record<string, string> = {
  titulo: 'Título',
  descripcion: 'Descripción',
  estado_qa: 'Estado QA',
  estado_req: 'Estado del Requerimiento',
  iteracion: 'Iteración',
  responsable_qa: 'Responsable QA',
  horas_estimadas: 'Horas Estimadas',
  horas_reales: 'Horas Reales',
  cp_total: 'CP Total',
  cp_ok: 'CP OK',
  cp_fallo: 'CP Fallo',
  bloqueado: 'Bloqueado',
  motivo_bloqueo: 'Motivo Bloqueo',
  defectos_qa: 'Defectos QA',
  defectos_uat: 'Defectos UAT',
  observaciones: 'Observaciones',
}

// Tipo de tarea del registro diario de Actividades (lista inicial, ajustable)
export const TIPO_TAREA_LABELS: Record<TipoTareaEnum, string> = {
  ANALISIS_REQUERIMIENTO: 'Análisis de Requerimiento',
  DISENO_CASOS_PRUEBA: 'Diseño de Casos de Prueba',
  EJECUCION_PRUEBAS: 'Ejecución de Pruebas',
  REPORTE_DEFECTOS: 'Reporte de Defectos',
  REUNION: 'Reunión',
  SOPORTE_PRODUCCION: 'Soporte en Producción',
  DOCUMENTACION: 'Documentación',
  CAPACITACION: 'Capacitación',
  OTROS: 'Otros',
}

// ─── Catálogo de Períodos ──────────────────────────────────────
// Rangos mensuales (del día 3 al día 2 del mes siguiente) con su
// Iteración asociada, que cicla 1→6 de forma continua. El primer
// período es irregular (02 Ene – 28 Feb 2025) y arranca el ciclo en 1.
export interface PeriodoOption {
  value: string
  label: string
  iteracion: number
  from: string   // 'YYYY-MM-DD'
  to: string     // 'YYYY-MM-DD'
}

const MESES_ABREV  = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmtPeriodoFecha(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_ABREV[d.getMonth()]} ${d.getFullYear()}`
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function generatePeriodos(aniosAdelante = 8): PeriodoOption[] {
  const periodos: PeriodoOption[] = []

  // Período inicial irregular
  const p0Start = new Date(2025, 0, 2)
  const p0End   = new Date(2025, 1, 28)
  const p0Label = `${fmtPeriodoFecha(p0Start)} - ${fmtPeriodoFecha(p0End)}`
  periodos.push({ value: p0Label, label: p0Label, iteracion: 1, from: toISO(p0Start), to: toISO(p0End) })

  let cursorStart = new Date(2025, 2, 3) // 03 Mar 2025
  let iter = 2
  const totalMeses = aniosAdelante * 12

  for (let i = 0; i < totalMeses; i++) {
    const end = new Date(cursorStart)
    end.setMonth(end.getMonth() + 1)
    end.setDate(end.getDate() - 1)

    const label = `${fmtPeriodoFecha(cursorStart)} - ${fmtPeriodoFecha(end)}`
    const mesLabel = `${MESES_NOMBRE[cursorStart.getMonth()]} ${cursorStart.getFullYear()}`
    periodos.push({ value: mesLabel, label: mesLabel, iteracion: iter, from: toISO(cursorStart), to: toISO(end) })

    iter = iter === 6 ? 1 : iter + 1
    cursorStart = new Date(cursorStart)
    cursorStart.setMonth(cursorStart.getMonth() + 1)
  }

  return periodos
}

export const PERIODOS: PeriodoOption[] = generatePeriodos()
