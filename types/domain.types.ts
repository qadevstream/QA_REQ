import type {
  ActividadEstadoEnum,
  ActividadPrioridadEnum,
  ActividadProgresoEnum,
  CargoEnum,
  EstadoQaEnum,
  TipoRequerimientoEnum,
  UserRole,
} from './database.types'

export type {
  UserRole, ActividadEstadoEnum, ActividadPrioridadEnum,
  ActividadProgresoEnum, TipoRequerimientoEnum,
}

export interface AplicativoCatalogo {
  codigo: string
  nombre: string
  color: string
  activo: boolean
  orden: number
  ati_responsable: string | null
  correo: string | null
  aplicativo_grupo: string | null
}

export interface CatAplicativo {
  aplicativo: string
  activo: boolean
  orden: number
}

export interface CatTipoTarea {
  tipo_tarea: string
  activo: boolean
  orden: number
}

// Feriado que reduce los días hábiles del período que contiene su fecha.
// `horas` es lo que descuenta de la jornada: 8 = día completo, 4 = medio día.
export interface CatFeriado {
  fecha: string   // 'YYYY-MM-DD'
  nombre: string
  horas: number
  activo: boolean
}

export interface Profile {
  id: string
  full_name: string
  cargo: CargoEnum
  dni: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Iteración de requerimiento ─────────────────────────────────────────────
export interface RequirementIteration {
  id: string
  requirement_id: string
  iteracion: number

  fecha_asignacion: string | null
  fecha_entrega_estimacion: string | null
  fecha_aprobacion_estimacion: string | null
  fecha_inicio_planificada: string | null
  fecha_inicio_real: string | null
  fecha_entrega_planificada: string | null
  fecha_entrega_real: string | null

  estado_qa: EstadoQaEnum
  estado_req: string | null
  avance_porcentaje: number
  prioridad: ActividadPrioridadEnum

  cp_total: number
  cp_ok: number
  cp_fallo: number
  horas_estimadas: number
  horas_reales: number

  defectos_qa: number
  defectos_uat: number
  defectos_produccion: number

  rutas_evidencias: string | null
  observaciones_estado: string | null
  bloqueado: boolean
  motivo_bloqueo: string | null

  created_by: string | null
  created_at: string
  updated_at: string
  // Campos de la actividad vinculada (opcional, viene del join)
  actividad_estado?: string | null
  actividad_progreso?: string | null
}

export interface CreateRequirementIterationInput {
  requirement_id: string
  iteracion?: number
  fecha_asignacion?: string
  fecha_entrega_estimacion?: string
  fecha_aprobacion_estimacion?: string
  fecha_inicio_planificada?: string
  fecha_inicio_real?: string
  fecha_entrega_planificada?: string
  fecha_entrega_real?: string
  estado_qa?: EstadoQaEnum
  estado_req?: string
  avance_porcentaje?: number
  prioridad?: ActividadPrioridadEnum
  cp_total?: number
  cp_ok?: number
  cp_fallo?: number
  horas_estimadas?: number
  horas_reales?: number
  defectos_qa?: number
  defectos_uat?: number
  defectos_produccion?: number
  rutas_evidencias?: string
  observaciones_estado?: string
  bloqueado?: boolean
  motivo_bloqueo?: string
}

// ─── Requerimiento padre ─────────────────────────────────────────────────────
export interface Requirement {
  id: string
  codigo_requerimiento: string
  titulo: string
  descripcion: string | null
  aplicativo: string
  tipo_requerimiento: TipoRequerimientoEnum | null
  gestor_responsable: string | null
  ati_responsable: string | null

  responsable_qa_id: string | null
  responsable_qa?: Profile | null
  qa_apoyo_1_id: string | null
  qa_apoyo_1?: Profile | null
  qa_apoyo_2_id: string | null
  qa_apoyo_2?: Profile | null
  qa_apoyo_3_id: string | null
  qa_apoyo_3?: Profile | null

  iterations?: RequirementIteration[]

  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateRequirementInput {
  codigo_requerimiento: string
  titulo?: string
  descripcion?: string
  aplicativo: string
  tipo_requerimiento?: TipoRequerimientoEnum
  gestor_responsable?: string
  ati_responsable?: string
  responsable_qa_id?: string
  qa_apoyo_1_id?: string
  qa_apoyo_2_id?: string
  qa_apoyo_3_id?: string
  // Primera iteración (se crea automáticamente junto con el req padre)
  firstIteration?: CreateRequirementIterationInput
}

export type UpdateRequirementInput = Partial<Omit<CreateRequirementInput, 'codigo_requerimiento' | 'firstIteration'>>

export interface RequirementHistory {
  id: string
  requirement_id: string
  changed_by: string | null
  changed_by_profile?: Profile
  campo_modificado: string
  valor_anterior: string | null
  valor_nuevo: string | null
  created_at: string
}

export interface DashboardMetrics {
  total_activos: number
  total_completados: number
  total_bloqueados: number
  total_vencidos: number
  by_estado: { estado: EstadoQaEnum; count: number }[]
  by_qa: { qa_name: string; count: number }[]
  by_aplicativo: { aplicativo: string; count: number }[]
}

export interface RequirementFilters {
  search?: string
  estado_qa?: EstadoQaEnum | 'ALL'
  aplicativo?: string | 'ALL'
  responsable_qa_id?: string | 'ALL'
}

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string; redirectTo?: string }
  | { success: false; error: string }

// ─── Actividades (tablero Kanban) ────────────────────────────────────────────
export interface Actividad {
  id: string
  tck: string
  aplicativo: string | null
  estado: ActividadEstadoEnum
  estado_changed_at: string
  posicion: number
  ati_responsable: string | null
  qa_asignado_id: string | null
  qa_asignado?: Profile | null
  fecha_inicio: string | null
  fecha_compromiso: string | null
  prioridad: ActividadPrioridadEnum
  progreso: ActividadProgresoEnum
  observaciones: string | null
  requirement_id: string | null
  iteration_id: string | null
  iteracion_num: number | null
  iter_fecha_inicio: string | null
  iter_fecha_vencimiento: string | null
  iter_cp_total: number
  iter_cp_ok: number
  iter_cp_fallo: number
  iter_horas_estimadas: number
  iter_horas_reales: number
  all_iteraciones?: { id: string; iteracion: number }[]
  created_by: string | null
  creado_por?: Profile | null
  created_at: string
  updated_at: string
  dias_en_estado?: number
}

export interface CreateActividadInput {
  tck: string
  aplicativo?: string
  estado?: ActividadEstadoEnum
  ati_responsable?: string
  qa_asignado_id?: string
  fecha_inicio?: string
  fecha_compromiso?: string
  prioridad?: ActividadPrioridadEnum
  progreso?: ActividadProgresoEnum
  observaciones?: string
  requirement_id?: string
  iteration_id?: string
}

export type UpdateActividadInput = Partial<CreateActividadInput>

export interface MoveActividadInput {
  id: string
  estado: ActividadEstadoEnum
  posicion: number
}

export interface ActividadEstadoHistorial {
  id: string
  actividad_id: string
  actividad?: { tck: string }
  estado_anterior: ActividadEstadoEnum | null
  estado_nuevo: ActividadEstadoEnum
  changed_by: string | null
  changed_by_profile?: Pick<Profile, 'id' | 'full_name' | 'role'>
  changed_at: string
}

// ─── Registro diario ──────────────────────────────────────────────────────────
export interface RegistroDiario {
  id: string
  periodo: string
  iteracion: number | null
  aplicativo: string | null
  codigo_app: string | null
  tipo_solicitud: TipoRequerimientoEnum | null
  tipo_tarea: string | null
  qa_id: string | null
  qa?: Profile | null
  horas_ejecutadas: number
  perfil: string | null
  nro_ticket: string | null
  fecha_reporte: string
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateRegistroDiarioInput {
  periodo: string
  iteracion?: number
  aplicativo?: string
  codigo_app?: string
  tipo_solicitud?: TipoRequerimientoEnum
  tipo_tarea?: string
  qa_id?: string
  horas_ejecutadas?: number
  perfil?: string
  nro_ticket?: string
  fecha_reporte?: string
  observaciones?: string
}

// ─── Analistas ───────────────────────────────────────────────────────────────
export interface CreateAnalistaInput {
  nombre: string
  cargo: CargoEnum
  correo: string
  dni: string
}

export interface UpdateStatusInput {
  id: string
  estado_qa: EstadoQaEnum
  bloqueado?: boolean
  motivo_bloqueo?: string
}

export interface UpdateObservationsInput {
  id: string
  observaciones_estado: string
}
