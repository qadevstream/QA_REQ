'use server'

import { revalidatePath } from 'next/cache'
import {
  findAllRequirements,
  createRequirement,
  findRequirementByCode,
  findExistingCodeIters,
  bulkCreateRequirements,
  deleteRequirement,
  createRequirementIteration,
  updateRequirementIteration,
  getNextIteracionNumber,
} from '@/server/repositories/requirements.repository'
import { createActividad, updateActividad } from '@/server/repositories/actividades.repository'
import { findAllProfiles } from '@/server/repositories/profiles.repository'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { ESTADO_QA_LABELS, TIPO_REQUERIMIENTO_LABELS } from '@/lib/constants'
import { resolveAplicativoByCodigo } from '@/lib/aplicativos'
import { resolveEnumValue, parseFecha, resolvePersonId } from '@/lib/import-helpers'
import type {
  ActionResult,
  CreateRequirementInput,
  CreateRequirementIterationInput,
  Requirement,
  RequirementIteration,
  RequirementFilters,
} from '@/types/domain.types'
import type { EstadoQaEnum, TipoRequerimientoEnum } from '@/types/database.types'

export async function getRequirementsAction(
  filters: RequirementFilters = {}
): Promise<ActionResult<Requirement[]>> {
  try {
    const data = await findAllRequirements(filters)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function createRequirementAction(
  _prevState: ActionResult<Requirement> | null,
  formData: FormData
): Promise<ActionResult<Requirement>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }

  const parentInput = extractParentFromFormData(formData)
  const iterInput = extractIterationFromFormData(formData)

  if (!parentInput.codigo_requerimiento.trim()) {
    return { success: false, error: 'El número de requerimiento es obligatorio.' }
  }

  const existing = await findRequirementByCode(parentInput.codigo_requerimiento)
  if (existing) {
    return { success: false, error: `Ya existe el requerimiento ${parentInput.codigo_requerimiento}. Para agregar una iteración ábrelo desde la tabla.` }
  }

  try {
    const data = await createRequirement({
      ...parentInput,
      firstIteration: iterInput,
      created_by: session.userId,
    })

    const firstIter = data.iterations?.[0]
    await createActividad({
      tck: data.codigo_requerimiento,
      aplicativo: data.aplicativo ?? undefined,
      estado: 'PEND_ASIGNACION',
      ati_responsable: data.ati_responsable ?? undefined,
      qa_asignado_id: data.responsable_qa_id ?? undefined,
      prioridad: (firstIter?.prioridad as any) ?? 'MEDIA',
      requirement_id: data.id,
      iteration_id: firstIter?.id,
      created_by: session.userId,
    })

    revalidatePath('/requirements')
    revalidatePath('/planner')
    return { success: true, data, message: `Requerimiento ${data.codigo_requerimiento} registrado.` }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key) as string | null
  return v && v.trim() !== '' ? v : undefined
}

function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key)
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function extractParentFromFormData(formData: FormData): CreateRequirementInput {
  return {
    codigo_requerimiento: (formData.get('nro_req') as string) ?? '',
    titulo: str(formData, 'titulo') ?? '',
    descripcion: str(formData, 'descripcion'),
    aplicativo: (formData.get('aplicativo') as string) ?? '',
    tipo_requerimiento: (formData.get('tipo') as TipoRequerimientoEnum) || undefined,
    ati_responsable: str(formData, 'ati_responsable'),
    responsable_qa_id: str(formData, 'qa_responsable'),
    qa_apoyo_1_id: str(formData, 'qa_apoyo_1'),
    qa_apoyo_2_id: str(formData, 'qa_apoyo_2'),
    qa_apoyo_3_id: str(formData, 'qa_apoyo_3'),
  }
}

function extractIterationFromFormData(formData: FormData): CreateRequirementIterationInput {
  return {
    requirement_id: '',
    iteracion: 1,
    estado_qa: (formData.get('estado_qa') as EstadoQaEnum) || 'PEND_ASIGNACION',
    estado_req: str(formData, 'estado_req'),
    avance_porcentaje: num(formData, 'avance_porcentaje') ?? 0,
    prioridad: (formData.get('prioridad') as any) || 'MEDIA',
    cp_total: num(formData, 'cp_total') ?? 0,
    cp_ok: num(formData, 'cp_ok') ?? 0,
    cp_fallo: num(formData, 'cp_fallo') ?? 0,
    horas_estimadas: num(formData, 'horas_estimadas') ?? 0,
    fecha_asignacion: str(formData, 'fecha_asignacion'),
    fecha_entrega_estimacion: str(formData, 'fecha_entrega_estimacion'),
    fecha_aprobacion_estimacion: str(formData, 'fecha_aprobacion_estimacion'),
    fecha_inicio_planificada: str(formData, 'fecha_inicio_planificada'),
    fecha_inicio_real: str(formData, 'fecha_inicio_real'),
    fecha_entrega_planificada: str(formData, 'fecha_entrega_planificada'),
    fecha_entrega_real: str(formData, 'fecha_entrega_real'),
    defectos_qa: num(formData, 'defectos_qa') ?? 0,
    defectos_uat: num(formData, 'defectos_uat') ?? 0,
    defectos_produccion: num(formData, 'defectos_produccion') ?? 0,
    rutas_evidencias: str(formData, 'rutas_evidencias'),
    observaciones_estado: str(formData, 'observaciones_estado'),
  }
}

// ─── Agregar nueva iteración a un req existente ───────────────────────────────

export async function addIterationAction(
  requirementId: string
): Promise<ActionResult<RequirementIteration>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role === 'CLIENTE') return { success: false, error: 'Sin permiso.' }

  try {
    // Verificar que la última iteración esté TERMINADO o CANCELADO
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: lastIter } = await supabase
      .from('requirement_iterations')
      .select('iteracion, estado_qa')
      .eq('requirement_id', requirementId)
      .order('iteracion', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastIter && lastIter.estado_qa !== 'TERMINADO' && lastIter.estado_qa !== 'CANCELADO') {
      return {
        success: false,
        error: `La iteración ${lastIter.iteracion} debe estar en estado TERMINADO o CANCELADO antes de crear una nueva.`,
      }
    }

    // Datos del req padre para crear la actividad
    const { data: reqData } = await supabase
      .from('requirements')
      .select('codigo_requerimiento, aplicativo, ati_responsable, responsable_qa_id')
      .eq('id', requirementId)
      .single()

    const nextIter = (lastIter?.iteracion ?? 0) + 1
    const iter = await createRequirementIteration(
      { requirement_id: requirementId, iteracion: nextIter },
      session.userId
    )

    // Crear actividad en el planner para esta nueva iteración
    if (reqData) {
      await createActividad({
        tck: reqData.codigo_requerimiento,
        aplicativo: reqData.aplicativo ?? undefined,
        estado: 'PEND_ASIGNACION',
        ati_responsable: reqData.ati_responsable ?? undefined,
        qa_asignado_id: reqData.responsable_qa_id ?? undefined,
        prioridad: 'MEDIA',
        requirement_id: requirementId,
        iteration_id: iter.id,
        created_by: session.userId,
      })
    }

    revalidatePath('/requirements')
    revalidatePath('/actividades')
    return { success: true, data: iter, message: `Iteración ${nextIter} creada.` }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Actualizar iteración ─────────────────────────────────────────────────────

export async function updateIterationAction(
  iterationId: string,
  fields: Partial<CreateRequirementIterationInput>
): Promise<ActionResult<RequirementIteration>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role === 'CLIENTE') return { success: false, error: 'Sin permiso.' }

  try {
    const data = await updateRequirementIteration(iterationId, fields)

    // Sincronizar estado del planner si cambia estado_qa
    if (fields.estado_qa) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: act } = await supabase
        .from('actividades')
        .select('id')
        .eq('iteration_id', iterationId)
        .maybeSingle()

      if (act?.id) {
        const VALID_ESTADOS = [
          'PEND_ASIGNACION', 'EN_ESTIMACION', 'PEND_APROB_ATI',
          'EN_PRUEBAS_QA', 'OBSERVADO_BLOQUEADO', 'EN_PRUEBAS_USUARIO', 'TERMINADO',
        ]
        if (VALID_ESTADOS.includes(fields.estado_qa)) {
          await updateActividad(act.id, { estado: fields.estado_qa as any })
        }
      }
    }

    revalidatePath('/requirements')
    revalidatePath('/actividades')
    revalidatePath('/reportes')
    return { success: true, data, message: 'Iteración actualizada.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Actualizar req padre ─────────────────────────────────────────────────────

export async function updateRequirementAction(
  id: string,
  fields: Partial<CreateRequirementInput>
): Promise<ActionResult<Requirement>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role === 'CLIENTE') return { success: false, error: 'Sin permiso.' }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { firstIteration: _fi, ...dbFields } = fields
  const { error } = await supabase
    .from('requirements')
    .update({ ...dbFields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/requirements')
  const data = await findAllRequirements().then((all) => all.find((r) => r.id === id)!)
  return { success: true, data, message: 'Requerimiento actualizado.' }
}

// ─── Eliminar req ─────────────────────────────────────────────────────────────

export async function deleteRequirementAction(id: string): Promise<ActionResult<undefined>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role === 'CLIENTE') return { success: false, error: 'Sin permiso.' }

  try {
    await deleteRequirement(id)
    revalidatePath('/requirements')
    return { success: true, data: undefined, message: 'Requerimiento eliminado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Importación masiva desde Excel ──────────────────────────────────────────

export interface OmittedRow {
  nro_req: string
  aplicativo: string
  motivo: string
}

export interface RequirementImportRow {
  nro_req?: string
  titulo?: string
  descripcion?: string
  ati_responsable?: string
  tipo?: string
  prioridad?: string
  fecha_asignacion?: string
  fecha_entrega_estimacion?: string
  fecha_aprobacion_estimacion?: string
  aplicativo?: string
  qa_responsable?: string
  qa_apoyo_1?: string
  qa_apoyo_2?: string
  qa_apoyo_3?: string
  avance_porcentaje?: string | number
  estado_qa?: string
  estado_req?: string
  fecha_entrega_planificada?: string
  fecha_entrega_real?: string
  iteracion?: string | number
  cp_total?: string | number
  cp_ok?: string | number
  cp_fallo?: string | number
  horas_estimadas?: string | number
  horas_reales?: string | number
  fecha_inicio_planificada?: string
  fecha_inicio_real?: string
  defectos_qa?: string | number
  defectos_uat?: string | number
  defectos_produccion?: string | number
  rutas_evidencias?: string
  observaciones_estado?: string
}

function toSmallInt(raw: string | number | undefined, treatFractionAsPercent = false): number {
  if (raw === undefined || raw === '') return 0
  let n = Number(raw)
  if (!Number.isFinite(n)) return 0
  if (treatFractionAsPercent && n > 0 && n <= 1) n *= 100
  return Math.round(n)
}

function toNumber(raw: string | number | undefined): number {
  if (raw === undefined || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export async function bulkImportRequirementsAction(
  rows: RequirementImportRow[]
): Promise<ActionResult<{ creados: number; duplicados: number; omitidos: OmittedRow[] }>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') {
    return { success: false, error: 'Solo un Supervisor puede importar requerimientos masivamente.' }
  }

  const [analistas, catalogoAplicativos] = await Promise.all([
    findAllProfiles(),
    findAllAplicativos(false),
  ])

  const omitidos: OmittedRow[] = []
  const candidatos: (CreateRequirementInput & {
    created_by: string
    iteracion: number
    iterationData: Partial<CreateRequirementIterationInput>
  })[] = []
  const vistos = new Set<string>()

  for (const row of rows) {
    const codigo = row.nro_req?.trim()
    const aplicativo = resolveAplicativoByCodigo(row.aplicativo, catalogoAplicativos)
    const iter = row.iteracion ? Number(row.iteracion) : 1
    const claveUnica = `${codigo}||${iter}`

    if (!codigo) continue

    if (!aplicativo) {
      omitidos.push({ nro_req: codigo, aplicativo: row.aplicativo ?? '(vacío)', motivo: 'Aplicativo no reconocido' })
      continue
    }
    if (vistos.has(claveUnica)) {
      omitidos.push({ nro_req: codigo, aplicativo: row.aplicativo ?? '', motivo: `Duplicado en el Excel (iter. ${iter})` })
      continue
    }
    vistos.add(claveUnica)

    candidatos.push({
      codigo_requerimiento: codigo,
      titulo: row.titulo?.trim() || '',
      descripcion: row.descripcion?.trim() || undefined,
      ati_responsable: row.ati_responsable?.trim() || undefined,
      tipo_requerimiento: (resolveEnumValue(row.tipo, TIPO_REQUERIMIENTO_LABELS) as TipoRequerimientoEnum) || undefined,
      aplicativo,
      responsable_qa_id: resolvePersonId(row.qa_responsable, analistas),
      qa_apoyo_1_id: resolvePersonId(row.qa_apoyo_1, analistas),
      qa_apoyo_2_id: resolvePersonId(row.qa_apoyo_2, analistas),
      qa_apoyo_3_id: resolvePersonId(row.qa_apoyo_3, analistas),
      created_by: session.userId,
      iteracion: iter,
      iterationData: {
        estado_qa: (resolveEnumValue(row.estado_qa, ESTADO_QA_LABELS) as EstadoQaEnum) || 'PEND_ASIGNACION',
        estado_req: row.estado_req?.trim() || undefined,
        avance_porcentaje: toSmallInt(row.avance_porcentaje, true),
        prioridad: (['URGENTE', 'IMPORTANTE', 'MEDIA', 'BAJA'].includes((row.prioridad ?? '').toUpperCase())
          ? (row.prioridad as string).toUpperCase()
          : 'MEDIA') as any,
        cp_total: toSmallInt(row.cp_total),
        cp_ok: toSmallInt(row.cp_ok),
        cp_fallo: toSmallInt(row.cp_fallo),
        horas_estimadas: toNumber(row.horas_estimadas),
        horas_reales: toNumber(row.horas_reales),
        fecha_asignacion: parseFecha(row.fecha_asignacion),
        fecha_entrega_estimacion: parseFecha(row.fecha_entrega_estimacion),
        fecha_aprobacion_estimacion: parseFecha(row.fecha_aprobacion_estimacion),
        fecha_inicio_planificada: parseFecha(row.fecha_inicio_planificada),
        fecha_inicio_real: parseFecha(row.fecha_inicio_real),
        fecha_entrega_planificada: parseFecha(row.fecha_entrega_planificada),
        fecha_entrega_real: parseFecha(row.fecha_entrega_real),
        defectos_qa: toSmallInt(row.defectos_qa),
        defectos_uat: toSmallInt(row.defectos_uat),
        defectos_produccion: toSmallInt(row.defectos_produccion),
        rutas_evidencias: row.rutas_evidencias?.trim() || undefined,
        observaciones_estado: row.observaciones_estado?.trim() || undefined,
      },
    })
  }

  // Detectar cuáles (ticket, iter) ya existen
  const existentes = await findExistingCodeIters(
    candidatos.map((c) => ({ codigo: c.codigo_requerimiento, iteracion: c.iteracion }))
  )
  const nuevos = candidatos.filter((c) => !existentes.has(`${c.codigo_requerimiento}||${c.iteracion}`))
  const duplicadosEnBD = candidatos.filter((c) => existentes.has(`${c.codigo_requerimiento}||${c.iteracion}`))

  for (const d of duplicadosEnBD) {
    omitidos.push({ nro_req: d.codigo_requerimiento, aplicativo: d.aplicativo, motivo: `Ya existe en BD (iter. ${d.iteracion})` })
  }

  if (nuevos.length === 0) {
    return {
      success: true,
      data: { creados: 0, duplicados: duplicadosEnBD.length, omitidos },
      message: 'No se importó ningún requerimiento nuevo.',
    }
  }

  // Para reqs que ya existen como padre solo insertamos la iteración nueva
  const codigosExistentes = await Promise.all(
    nuevos.map((c) => findRequirementByCode(c.codigo_requerimiento))
  )

  const paraCrear = nuevos.filter((_, i) => !codigosExistentes[i])
  const soloIter = nuevos.filter((_, i) => !!codigosExistentes[i])
    .map((c, i) => ({ ...c, existingId: codigosExistentes[nuevos.indexOf(c)]!.id }))

  // Insertar padres nuevos + sus iteraciones
  const insertados = paraCrear.length > 0 ? await bulkCreateRequirements(paraCrear) : []

  // Insertar iteraciones para padres ya existentes + crear actividad por cada una
  if (soloIter.length > 0) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const iterRows = soloIter.map((c) => ({
      requirement_id: c.existingId,
      iteracion: c.iteracion,
      created_by: session.userId,
      ...c.iterationData,
    }))
    const { data: iterInserted, error } = await supabase
      .from('requirement_iterations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(iterRows as any)
      .select('id, requirement_id')
    if (error) throw new Error(error.message)

    // Crear actividad en el planner para cada iteración nueva de req existente
    if (iterInserted && iterInserted.length > 0) {
      const reqIds = [...new Set(iterInserted.map((i) => i.requirement_id))]
      const { data: reqRows } = await supabase
        .from('requirements')
        .select('id, codigo_requerimiento, aplicativo, ati_responsable, responsable_qa_id')
        .in('id', reqIds)
      const reqMap = Object.fromEntries((reqRows ?? []).map((r) => [r.id, r]))

      await Promise.all(
        iterInserted.map((iter) => {
          const req = reqMap[iter.requirement_id]
          if (!req) return Promise.resolve()
          return createActividad({
            tck: req.codigo_requerimiento,
            aplicativo: req.aplicativo ?? undefined,
            estado: 'PEND_ASIGNACION',
            ati_responsable: req.ati_responsable ?? undefined,
            qa_asignado_id: req.responsable_qa_id ?? undefined,
            prioridad: 'MEDIA',
            requirement_id: req.id,
            iteration_id: iter.id,
            created_by: session.userId,
          })
        })
      )
    }
  }

  // Crear actividades para reqs nuevos
  if (insertados.length > 0) {
    await Promise.all(
      insertados.map((req) =>
        createActividad({
          tck: req.codigo_requerimiento,
          aplicativo: req.aplicativo ?? undefined,
          estado: 'PEND_ASIGNACION',
          ati_responsable: req.ati_responsable ?? undefined,
          qa_asignado_id: req.responsable_qa_id ?? undefined,
          prioridad: 'MEDIA',
          requirement_id: req.id,
          created_by: session.userId,
        })
      )
    )
  }

  revalidatePath('/requirements')
  revalidatePath('/planner')

  const creados = insertados.length + soloIter.length

  return {
    success: true,
    data: { creados, duplicados: duplicadosEnBD.length, omitidos },
    message: `${creados} importado${creados !== 1 ? 's' : ''}` +
      `${duplicadosEnBD.length > 0 ? ` · ${duplicadosEnBD.length} ya existían` : ''}` +
      `${omitidos.length > 0 ? ` · ${omitidos.length} omitidos` : ''}.`,
  }
}

// ─── Sincronizar planner: crea actividades para iteraciones que no tienen ninguna ─
export async function syncPlannerAction(): Promise<ActionResult<{ sincronizados: number }>> {
  const session = await getCurrentUser()
  if (!session) return { success: false, error: 'No autenticado.' }
  if (session.profile.role === 'CLIENTE') return { success: false, error: 'Sin permiso.' }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Traer todas las iteraciones con datos del req padre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: iterations, error: iterErr } = await (supabase as any)
      .from('requirement_iterations')
      .select(`
        id,
        iteracion,
        requirement_id,
        requirements!inner(
          id, codigo_requerimiento, aplicativo, ati_responsable, responsable_qa_id
        )
      `)
    if (iterErr) throw new Error(iterErr.message)

    // Traer todos los iteration_id ya vinculados en actividades
    const { data: linked } = await supabase
      .from('actividades')
      .select('iteration_id')
      .not('iteration_id', 'is', null)
    const linkedIds = new Set((linked ?? []).map((a) => a.iteration_id as string))

    // Filtrar iteraciones sin actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sinActividad = (iterations ?? [] as any[]).filter((it: any) => !linkedIds.has(it.id))

    if (sinActividad.length === 0) {
      return { success: true, data: { sincronizados: 0 }, message: 'El planner ya está sincronizado.' }
    }

    await Promise.all(
      sinActividad.map((it: any) => {
        const req = Array.isArray(it.requirements) ? it.requirements[0] : it.requirements as any
        return createActividad({
          tck: req.codigo_requerimiento,
          aplicativo: req.aplicativo ?? undefined,
          estado: 'PEND_ASIGNACION',
          ati_responsable: req.ati_responsable ?? undefined,
          qa_asignado_id: req.responsable_qa_id ?? undefined,
          prioridad: 'MEDIA',
          requirement_id: req.id,
          iteration_id: it.id,
          created_by: session.userId,
        })
      })
    )

    revalidatePath('/planner')
    revalidatePath('/actividades')
    return {
      success: true,
      data: { sincronizados: sinActividad.length },
      message: `${sinActividad.length} tarjeta${sinActividad.length !== 1 ? 's' : ''} sincronizada${sinActividad.length !== 1 ? 's' : ''} en el planner.`,
    }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
