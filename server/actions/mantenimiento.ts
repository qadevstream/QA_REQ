'use server'

import { revalidatePath } from 'next/cache'
import {
  createAplicativo,
  updateAplicativo,
  deleteAplicativo,
} from '@/server/repositories/aplicativosCatalogo.repository'
import {
  createCatAplicativo,
  updateCatAplicativo,
  deleteCatAplicativo,
} from '@/server/repositories/catAplicativo.repository'
import {
  createCatTipoTarea,
  updateCatTipoTarea,
  deleteCatTipoTarea,
} from '@/server/repositories/catTipoTarea.repository'
import {
  createFeriado,
  updateFeriado,
  deleteFeriado,
} from '@/server/repositories/feriados.repository'
import { getCurrentUser } from '@/server/actions/auth'
import type { ActionResult, AplicativoCatalogo, CatAplicativo, CatTipoTarea, CatFeriado } from '@/types/domain.types'

// Pueden modificar los catálogos de Mantenimiento: Supervisor, Administrador
// y Analista QA. El Cliente queda excluido. La RLS (migración 036) refleja
// este mismo permiso en la base de datos.
async function requireCatalogEditor() {
  const session = await getCurrentUser()
  if (!session) return { error: 'No autenticado.' }
  const rol = session.profile.role
  if (rol !== 'SUPERVISOR' && rol !== 'ADMINISTRADOR' && rol !== 'ANALISTA_QA') {
    return { error: 'No tienes permiso para modificar el catálogo.' }
  }
  return { session }
}

export async function createAplicativoAction(
  input: { codigo: string; nombre: string; color?: string; ati_responsable?: string; correo?: string; aplicativo_grupo?: string }
): Promise<ActionResult<AplicativoCatalogo>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.codigo.trim()) return { success: false, error: 'El código es obligatorio.' }
  if (!input.nombre.trim()) return { success: false, error: 'El nombre es obligatorio.' }

  try {
    const data = await createAplicativo({
      codigo: input.codigo.trim().toUpperCase(),
      nombre: input.nombre.trim(),
      color: input.color ?? '#94A3B8',
      activo: true,
      orden: 999,
      ati_responsable: input.ati_responsable?.trim() || null,
      correo: input.correo?.trim() || null,
      aplicativo_grupo: input.aplicativo_grupo?.trim() || null,
    })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateAplicativoAction(
  codigo: string,
  input: { nombre?: string; color?: string; activo?: boolean; ati_responsable?: string | null; correo?: string | null; aplicativo_grupo?: string | null }
): Promise<ActionResult<AplicativoCatalogo>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateAplicativo(codigo, input)
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo actualizado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteAplicativoAction(codigo: string): Promise<ActionResult> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteAplicativo(codigo)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── cat_aplicativo ────────────────────────────────────────────────

export async function createCatAplicativoAction(
  input: { aplicativo: string }
): Promise<ActionResult<CatAplicativo>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.aplicativo.trim()) return { success: false, error: 'El nombre del aplicativo es obligatorio.' }

  try {
    const data = await createCatAplicativo({ aplicativo: input.aplicativo.trim(), activo: true, orden: 999 })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Aplicativo creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateCatAplicativoAction(
  aplicativo: string,
  input: { activo?: boolean }
): Promise<ActionResult<CatAplicativo>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateCatAplicativo(aplicativo, input)
    revalidatePath('/mantenimiento')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteCatAplicativoAction(aplicativo: string): Promise<ActionResult> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteCatAplicativo(aplicativo)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── cat_tipo_tarea ────────────────────────────────────────────────

export async function createCatTipoTareaAction(
  input: { tipo_tarea: string }
): Promise<ActionResult<CatTipoTarea>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!input.tipo_tarea.trim()) return { success: false, error: 'El tipo de tarea es obligatorio.' }

  try {
    const data = await createCatTipoTarea({ tipo_tarea: input.tipo_tarea.trim(), activo: true, orden: 999 })
    revalidatePath('/mantenimiento')
    return { success: true, data, message: 'Tipo de tarea creado.' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateCatTipoTareaAction(
  tipo_tarea: string,
  input: { activo?: boolean }
): Promise<ActionResult<CatTipoTarea>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    const data = await updateCatTipoTarea(tipo_tarea, input)
    revalidatePath('/mantenimiento')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteCatTipoTareaAction(tipo_tarea: string): Promise<ActionResult> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteCatTipoTarea(tipo_tarea)
    revalidatePath('/mantenimiento')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ── cat_feriados ──────────────────────────────────────────────────
// Cambiar un feriado mueve la meta de horas del período que contiene su
// fecha, así que también se revalida el dashboard.

function revalidarFeriados() {
  revalidatePath('/mantenimiento')
  revalidatePath('/dashboard')
}

export async function createFeriadoAction(
  input: { fecha: string; nombre: string; horas?: number }
): Promise<ActionResult<CatFeriado>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) {
    return { success: false, error: 'La fecha es obligatoria (formato AAAA-MM-DD).' }
  }
  if (!input.nombre.trim()) return { success: false, error: 'El nombre del feriado es obligatorio.' }

  const horas = input.horas ?? 8
  if (!(horas > 0 && horas <= 24)) {
    return { success: false, error: 'Las horas deben estar entre 0 y 24.' }
  }

  try {
    const data = await createFeriado({
      fecha: input.fecha,
      nombre: input.nombre.trim(),
      horas,
      activo: true,
    })
    revalidarFeriados()
    return { success: true, data, message: 'Feriado agregado.' }
  } catch (e) {
    const msg = (e as Error).message
    // La fecha es PK: un duplicado es lo más probable que falle acá.
    if (msg.includes('duplicate') || msg.includes('23505')) {
      return { success: false, error: 'Ya existe un feriado registrado en esa fecha.' }
    }
    return { success: false, error: msg }
  }
}

export async function updateFeriadoAction(
  fecha: string,
  input: { nombre?: string; horas?: number; activo?: boolean }
): Promise<ActionResult<CatFeriado>> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  if (input.horas !== undefined && !(input.horas > 0 && input.horas <= 24)) {
    return { success: false, error: 'Las horas deben estar entre 0 y 24.' }
  }

  try {
    const data = await updateFeriado(fecha, input)
    revalidarFeriados()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteFeriadoAction(fecha: string): Promise<ActionResult> {
  const check = await requireCatalogEditor()
  if ('error' in check) return { success: false, error: check.error! }

  try {
    await deleteFeriado(fecha)
    revalidarFeriados()
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
