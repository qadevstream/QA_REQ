'use client'

import { useState, useMemo } from 'react'
import { Download, Search, CalendarDays } from 'lucide-react'
import { apLabelShort } from '@/lib/aplicativos'
import { TIPO_REQUERIMIENTO_LABELS, ESTADO_QA_LABELS, ACTIVIDAD_PROGRESO_LABELS, PERIODOS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { Requirement, AplicativoCatalogo } from '@/types/domain.types'

interface Props {
  requirements: Requirement[]
  aplicativos: AplicativoCatalogo[]
}

interface FlatRow {
  // Req padre
  codigo: string
  titulo: string
  aplicativo: string
  tipo: string
  ati: string
  qa_responsable: string
  qa_apoyo_1: string
  qa_apoyo_2: string
  // Iteración
  iteracion: number
  estado_qa: string
  estado_req: string
  progreso: string
  prioridad: string
  avance: number
  cp_ok: number
  cp_fallo: number
  cp_total: number
  horas_est: number
  horas_real: number
  avance_hrs: number
  def_qa: number
  def_uat: number
  def_prod: number
  fecha_asignacion: string
  fecha_entrega_planificada: string
  fecha_entrega_real: string
  fecha_inicio_planificada: string
  fecha_inicio_real: string
  observaciones: string
}

const PRIORIDAD_COLORS: Record<string, string> = {
  URGENTE:    'bg-red-100 text-red-700',
  IMPORTANTE: 'bg-orange-100 text-orange-700',
  MEDIA:      'bg-green-100 text-green-700',
  BAJA:       'bg-slate-100 text-slate-600',
}

const ESTADO_COLORS: Record<string, string> = {
  PEND_ASIGNACION:      'bg-slate-100 text-slate-600',
  EN_ESTIMACION:        'bg-blue-100 text-blue-700',
  PEND_APROB_ATI:       'bg-yellow-100 text-yellow-700',
  EN_PRUEBAS_QA:        'bg-purple-100 text-purple-700',
  OBSERVADO_BLOQUEADO:  'bg-red-100 text-red-700',
  EN_PRUEBAS_USUARIO:   'bg-orange-100 text-orange-700',
  TERMINADO:            'bg-emerald-100 text-emerald-700',
  CANCELADO:            'bg-slate-100 text-slate-400',
}

function exportToCSV(rows: FlatRow[]) {
  const headers = [
    'Nro. Req','Título','Aplicativo','Tipo','ATI','QA Resp.','QA Apoyo 1','QA Apoyo 2',
    'Iter.','Estado QA','Estado Req.','Progreso','Prioridad','Avance %',
    'CP Total','CP OK','CP Fal.',
    'H. Est.','H. Real','Avance Hrs %',
    'Def. QA','Def. UAT','Def. Prod.',
    'F. Asignación','F. Ini. Plan.','F. Ini. Real','F. Ent. Plan.','F. Ent. Real',
    'Observaciones',
  ]
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.codigo, r.titulo, r.aplicativo, r.tipo, r.ati, r.qa_responsable, r.qa_apoyo_1, r.qa_apoyo_2,
      r.iteracion, r.estado_qa, r.estado_req, r.progreso, r.prioridad, r.avance,
      r.cp_total, r.cp_ok, r.cp_fallo,
      r.horas_est, r.horas_real, r.avance_hrs,
      r.def_qa, r.def_uat, r.def_prod,
      r.fecha_asignacion, r.fecha_inicio_planificada, r.fecha_inicio_real,
      r.fecha_entrega_planificada, r.fecha_entrega_real,
      r.observaciones,
    ].map(escape).join(',')),
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_semanal_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Períodos descendentes (más reciente primero), excluyendo el primero irregular
const PERIODO_OPTIONS = [...PERIODOS].reverse()

// Detectar el período actual
function getCurrentPeriodoValue(): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const found = PERIODOS.find(p => p.from <= todayStr && todayStr <= p.to)
  return found?.value ?? PERIODO_OPTIONS[0]?.value ?? 'ALL'
}

export function ReporteSemanalTable({ requirements, aplicativos }: Props) {
  const [search, setSearch] = useState('')
  const [filterAplicativo, setFilterAplicativo] = useState('ALL')
  const [filterEstado, setFilterEstado] = useState('ALL')
  const [filterPeriodo, setFilterPeriodo] = useState<string>(() => getCurrentPeriodoValue())

  const rows: FlatRow[] = useMemo(() => {
    const result: FlatRow[] = []
    for (const req of requirements) {
      const iters = req.iterations ?? []
      for (const it of iters) {
        result.push({
          codigo:       req.codigo_requerimiento,
          titulo:       req.titulo || '',
          aplicativo:   apLabelShort(req.aplicativo, aplicativos) || req.aplicativo,
          tipo:         req.tipo_requerimiento ? TIPO_REQUERIMIENTO_LABELS[req.tipo_requerimiento] : '—',
          ati:          req.ati_responsable || '—',
          qa_responsable: req.responsable_qa?.full_name ?? '—',
          qa_apoyo_1:   req.qa_apoyo_1?.full_name ?? '',
          qa_apoyo_2:   req.qa_apoyo_2?.full_name ?? '',
          iteracion:    it.iteracion,
          estado_qa:    it.estado_qa,
          estado_req:   it.estado_req || '',
          progreso:     it.actividad_progreso ?? '',
          prioridad:    it.prioridad,
          avance:       it.cp_total > 0 ? Math.min(100, Math.round(((it.cp_ok + it.cp_fallo) / it.cp_total) * 100)) : 0,
          cp_ok:        it.cp_ok,
          cp_fallo:     it.cp_fallo,
          cp_total:     it.cp_total ?? 0,
          horas_est:    it.horas_estimadas,
          horas_real:   it.horas_reales,
          avance_hrs:   it.horas_estimadas > 0 ? Math.min(100, Math.round((it.horas_reales / it.horas_estimadas) * 100)) : 0,
          def_qa:       it.defectos_qa,
          def_uat:      it.defectos_uat,
          def_prod:     it.defectos_produccion,
          fecha_asignacion:         it.fecha_asignacion || '',
          fecha_entrega_planificada: it.fecha_entrega_planificada || '',
          fecha_entrega_real:        it.fecha_entrega_real || '',
          fecha_inicio_planificada:  it.fecha_inicio_planificada || '',
          fecha_inicio_real:         it.fecha_inicio_real || '',
          observaciones: it.observaciones_estado || '',
        })
      }
    }
    return result
  }, [requirements, aplicativos])

  const aplicativosUnicos = useMemo(
    () => [...new Set(rows.map(r => r.aplicativo))].sort(),
    [rows]
  )

  const periodoActivo = useMemo(
    () => PERIODOS.find(p => p.value === filterPeriodo) ?? null,
    [filterPeriodo]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(r => {
      if (filterAplicativo !== 'ALL' && r.aplicativo !== filterAplicativo) return false
      if (filterEstado !== 'ALL' && r.estado_qa !== filterEstado) return false
      if (periodoActivo && r.fecha_asignacion) {
        if (r.fecha_asignacion < periodoActivo.from || r.fecha_asignacion > periodoActivo.to) return false
      }
      if (q && !r.codigo.toLowerCase().includes(q) && !r.titulo.toLowerCase().includes(q) &&
          !r.qa_responsable.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, filterAplicativo, filterEstado, periodoActivo])

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar req, título, QA…"
            className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Filtro período */}
        <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-600 px-3 py-1.5 shadow-sm">
          <CalendarDays className="h-4 w-4 text-white shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">Período</span>
            <select
              value={filterPeriodo}
              onChange={e => setFilterPeriodo(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="ALL" className="text-slate-900 bg-white font-normal">Todos los períodos</option>
              {PERIODO_OPTIONS.map(p => (
                <option key={p.value} value={p.value} className="text-slate-900 bg-white font-normal">{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <select
          value={filterAplicativo}
          onChange={e => setFilterAplicativo(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="ALL">Todos los aplicativos</option>
          {aplicativosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="ALL">Todos los estados</option>
          {Object.entries(ESTADO_QA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <span className="text-xs text-slate-400 ml-auto">{filtered.length} filas</span>

        <button
          onClick={() => exportToCSV(filtered)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {[
                'Nro. Req','Título','Aplicativo','Tipo','ATI',
                'QA Resp.','QA Apoyo',
                'Iter.','Estado QA','Estado Req.','Progreso','Prioridad','Avance %',
                'CP Tot.','CP OK','CP Fal.',
                'H. Est.','H. Real','Avance Hrs %',
                'Def. QA','Def. UAT','Def. Prod.',
                'F. Asig.','F. Ini. Plan.','F. Ini. Real','F. Ent. Plan.','F. Ent. Real',
                'Observaciones',
              ].map(h => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={27} className="py-10 text-center text-slate-400">Sin resultados</td>
              </tr>
            ) : filtered.map((r, i) => (
              <tr key={`${r.codigo}-${r.iteracion}`} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="px-3 py-2 font-mono font-semibold text-blue-600 whitespace-nowrap">{r.codigo}</td>
                <td className="px-3 py-2 max-w-[180px] truncate" title={r.titulo}>{r.titulo || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.aplicativo}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.tipo}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.ati}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.qa_responsable}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{[r.qa_apoyo_1, r.qa_apoyo_2].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-3 py-2 text-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold mx-auto">
                    {r.iteracion}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ESTADO_COLORS[r.estado_qa] ?? 'bg-slate-100 text-slate-600'}`}>
                    {ESTADO_QA_LABELS[r.estado_qa as keyof typeof ESTADO_QA_LABELS] ?? r.estado_qa}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500">{r.estado_req || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.progreso ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold
                      ${r.progreso === 'COMPLETADO'  ? 'bg-emerald-100 text-emerald-700'
                      : r.progreso === 'EN_CURSO'    ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-500'}`}>
                      {ACTIVIDAD_PROGRESO_LABELS[r.progreso as keyof typeof ACTIVIDAD_PROGRESO_LABELS] ?? r.progreso}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORIDAD_COLORS[r.prioridad] ?? ''}`}>
                    {r.prioridad}
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-medium">{r.avance}%</td>
                <td className="px-3 py-2 text-center">{r.cp_total}</td>
                <td className="px-3 py-2 text-center text-emerald-600 font-medium">{r.cp_ok}</td>
                <td className="px-3 py-2 text-center text-red-500 font-medium">{r.cp_fallo}</td>
                <td className="px-3 py-2 text-center">{r.horas_est}</td>
                <td className="px-3 py-2 text-center font-medium">{r.horas_real}</td>
                <td className="px-3 py-2 text-center font-medium text-orange-500">{r.avance_hrs}%</td>
                <td className="px-3 py-2 text-center text-red-400">{r.def_qa}</td>
                <td className="px-3 py-2 text-center text-orange-400">{r.def_uat}</td>
                <td className="px-3 py-2 text-center text-rose-500">{r.def_prod}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.fecha_asignacion ? formatDate(r.fecha_asignacion) : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.fecha_inicio_planificada ? formatDate(r.fecha_inicio_planificada) : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.fecha_inicio_real ? formatDate(r.fecha_inicio_real) : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.fecha_entrega_planificada ? formatDate(r.fecha_entrega_planificada) : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.fecha_entrega_real ? formatDate(r.fecha_entrega_real) : '—'}</td>
                <td className="px-3 py-2 max-w-[200px] truncate text-slate-400" title={r.observaciones}>{r.observaciones || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
