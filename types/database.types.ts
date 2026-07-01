// Generado manualmente para coincidir con el schema real de Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          cargo: CargoEnum
          dni: string | null
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          cargo?: CargoEnum
          dni?: string | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          cargo?: CargoEnum
          dni?: string | null
          role?: UserRole
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          id: string
          codigo_requerimiento: string
          titulo: string
          descripcion: string | null
          aplicativo: string
          tipo_requerimiento: TipoRequerimientoEnum | null
          gestor_responsable: string | null
          ati_responsable: string | null
          responsable_qa_id: string | null
          qa_apoyo_1_id: string | null
          qa_apoyo_2_id: string | null
          qa_apoyo_3_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo_requerimiento: string
          titulo?: string
          descripcion?: string | null
          aplicativo: string
          tipo_requerimiento?: TipoRequerimientoEnum | null
          gestor_responsable?: string | null
          ati_responsable?: string | null
          responsable_qa_id?: string | null
          qa_apoyo_1_id?: string | null
          qa_apoyo_2_id?: string | null
          qa_apoyo_3_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['requirements']['Insert']>
        Relationships: []
      }
      requirement_iterations: {
        Row: {
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
          estado_qa: string
          estado_req: string | null
          avance_porcentaje: number
          prioridad: string
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
        }
        Insert: {
          id?: string
          requirement_id: string
          iteracion?: number
          fecha_asignacion?: string | null
          fecha_entrega_estimacion?: string | null
          fecha_aprobacion_estimacion?: string | null
          fecha_inicio_planificada?: string | null
          fecha_inicio_real?: string | null
          fecha_entrega_planificada?: string | null
          fecha_entrega_real?: string | null
          estado_qa?: string
          estado_req?: string | null
          avance_porcentaje?: number
          prioridad?: string
          cp_ok?: number
          cp_fallo?: number
          horas_estimadas?: number
          horas_reales?: number
          defectos_qa?: number
          defectos_uat?: number
          defectos_produccion?: number
          rutas_evidencias?: string | null
          observaciones_estado?: string | null
          bloqueado?: boolean
          motivo_bloqueo?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['requirement_iterations']['Insert']>
        Relationships: []
      }
      requirement_history: {
        Row: {
          id: string
          requirement_id: string
          changed_by: string | null
          campo_modificado: string
          valor_anterior: string | null
          valor_nuevo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          requirement_id: string
          changed_by?: string | null
          campo_modificado: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      actividades: {
        Row: {
          id: string
          tck: string
          aplicativo: string | null
          estado: ActividadEstadoEnum
          estado_changed_at: string
          posicion: number
          ati_responsable: string | null
          qa_asignado_id: string | null
          fecha_inicio: string | null
          fecha_compromiso: string | null
          prioridad: ActividadPrioridadEnum
          progreso: ActividadProgresoEnum
          observaciones: string | null
          requirement_id: string | null
          iteration_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tck: string
          aplicativo?: string | null
          estado?: ActividadEstadoEnum
          estado_changed_at?: string
          posicion?: number
          ati_responsable?: string | null
          qa_asignado_id?: string | null
          fecha_inicio?: string | null
          fecha_compromiso?: string | null
          prioridad?: ActividadPrioridadEnum
          progreso?: ActividadProgresoEnum
          observaciones?: string | null
          requirement_id?: string | null
          iteration_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['actividades']['Insert']>
        Relationships: []
      }
      registro_diario: {
        Row: {
          id: string
          periodo: string
          iteracion: number | null
          aplicativo: string | null
          codigo_app: string | null
          tipo_solicitud: TipoRequerimientoEnum | null
          tipo_tarea: string | null
          qa_id: string | null
          horas_ejecutadas: number
          perfil: string | null
          nro_ticket: string | null
          fecha_reporte: string
          observaciones: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          periodo: string
          iteracion?: number | null
          aplicativo?: string | null
          codigo_app?: string | null
          tipo_solicitud?: TipoRequerimientoEnum | null
          tipo_tarea?: string | null
          qa_id?: string | null
          horas_ejecutadas?: number
          perfil?: string | null
          nro_ticket?: string | null
          fecha_reporte?: string
          observaciones?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['registro_diario']['Insert']>
        Relationships: []
      }
      aplicativos_catalogo: {
        Row: {
          codigo: string
          nombre: string
          color: string
          activo: boolean
          orden: number
          ati_responsable: string | null
          correo: string | null
          aplicativo_grupo: string | null
        }
        Insert: {
          codigo: string
          nombre: string
          color?: string
          activo?: boolean
          orden?: number
          ati_responsable?: string | null
          correo?: string | null
          aplicativo_grupo?: string | null
        }
        Update: Partial<Database['public']['Tables']['aplicativos_catalogo']['Insert']>
        Relationships: []
      }
      cat_aplicativo: {
        Row: {
          aplicativo: string
          activo: boolean
          orden: number
        }
        Insert: {
          aplicativo: string
          activo?: boolean
          orden?: number
        }
        Update: Partial<Database['public']['Tables']['cat_aplicativo']['Insert']>
        Relationships: []
      }
      cat_tipo_tarea: {
        Row: {
          tipo_tarea: string
          activo: boolean
          orden: number
        }
        Insert: {
          tipo_tarea: string
          activo?: boolean
          orden?: number
        }
        Update: Partial<Database['public']['Tables']['cat_tipo_tarea']['Insert']>
        Relationships: []
      }
      actividad_estado_historial: {
        Row: {
          id: string
          actividad_id: string
          estado_anterior: ActividadEstadoEnum | null
          estado_nuevo: ActividadEstadoEnum
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          actividad_id: string
          estado_anterior?: ActividadEstadoEnum | null
          estado_nuevo: ActividadEstadoEnum
          changed_by?: string | null
          changed_at?: string
        }
        Update: Partial<Database['public']['Tables']['actividad_estado_historial']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      cargo_enum: CargoEnum
      tipo_requerimiento_enum: TipoRequerimientoEnum
      estado_qa_enum: EstadoQaEnum
      estado_req_enum: EstadoReqEnum
      actividad_estado_enum: ActividadEstadoEnum
      actividad_prioridad_enum: ActividadPrioridadEnum
      actividad_progreso_enum: ActividadProgresoEnum
      tipo_tarea_enum: TipoTareaEnum
    }
  }
}

export type UserRole = 'SUPERVISOR' | 'ANALISTA_QA' | 'CLIENTE' | 'ADMINISTRADOR'

export type CargoEnum =
  | 'ADMINISTRADOR'
  | 'SUPERVISOR_QA'
  | 'ANALISTA_QA_SENIOR'
  | 'ANALISTA_QA'
  | 'ANALISTA_QA_JUNIOR'
  | 'TESTER'
  | 'EXT'

export type AplicativoEnum = string

export type TipoRequerimientoEnum =
  | 'PRY_ATENCIONES'
  | 'PRY_INCIDENTES'
  | 'PRY_REQUERIMIENTOS'

export type EstadoQaEnum =
  | 'PEND_ASIGNACION'
  | 'EN_ESTIMACION'
  | 'PEND_APROB_ATI'
  | 'EN_PRUEBAS_QA'
  | 'OBSERVADO_BLOQUEADO'
  | 'TERMINADO_CON_OBS'
  | 'TERMINADO'
  | 'EN_PRUEBAS_USUARIO'
  | 'PEND_IMPLEMENTACION_PRD'
  | 'IMPLEMENTADO_PRD'
  | 'CANCELADO'

export type EstadoReqEnum =
  | 'PENDIENTE'
  | 'EN_DESARROLLO'
  | 'EN_QA'
  | 'EN_UAT'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'EN_PRODUCCION'
  | 'CERRADO'

export type ActividadEstadoEnum =
  | 'PEND_ASIGNACION'
  | 'EN_ESTIMACION'
  | 'PEND_APROB_ATI'
  | 'EN_PRUEBAS_QA'
  | 'OBSERVADO_BLOQUEADO'
  | 'TERMINADO_CON_OBS'
  | 'TERMINADO'
  | 'EN_PRUEBAS_USUARIO'
  | 'PEND_IMPLEMENTACION_PRD'
  | 'IMPLEMENTADO_PRD'

export type ActividadPrioridadEnum = 'URGENTE' | 'IMPORTANTE' | 'MEDIA' | 'BAJA'
export type ActividadProgresoEnum = 'NO_INICIADO' | 'EN_CURSO' | 'COMPLETADO'

export type TipoTareaEnum =
  | 'ANALISIS_REQUERIMIENTO'
  | 'DISENO_CASOS_PRUEBA'
  | 'EJECUCION_PRUEBAS'
  | 'REPORTE_DEFECTOS'
  | 'REUNION'
  | 'SOPORTE_PRODUCCION'
  | 'DOCUMENTACION'
  | 'CAPACITACION'
  | 'OTROS'
