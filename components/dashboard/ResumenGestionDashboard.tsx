'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { ESTADOS_RESUMEN } from '@/lib/resumenGestion'
import type { ResumenGestionData, EstadoResumenKey } from '@/lib/resumenGestion'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function buildPeriodos() {
  const ahora = new Date()
  const lista = []
  for (let i = 0; i <= 11; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const ini = new Date(y, m, 3)
    const fin = new Date(y, m + 1, 2)
    const fmt = (dt: Date) => dt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    lista.push({
      value: `${y}-${m}`,
      label: `${MESES[m]} ${y}`,
      rango: `${fmt(ini)} – ${fmt(fin)} ${y}`,
      year: y,
      month: m,
    })
  }
  return lista
}

function pct(n: number, total: number) {
  if (!total) return '0.0'
  return ((n / total) * 100).toFixed(1)
}

function DonutChart({ data, total }: { data: { key: EstadoResumenKey; count: number; color: string }[]; total: number }) {
  const R = 52; const cx = 70; const cy = 70
  const circ = 2 * Math.PI * R
  let cum = 0
  const slices = data.filter((d) => d.count > 0).map((d) => {
    const ratio = d.count / (total || 1)
    const dash = ratio * circ
    const offset = circ - cum * circ
    cum += ratio
    return { ...d, dash, offset }
  })
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {total === 0
        ? <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e8f0" strokeWidth="18" />
        : slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))
      }
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#64748b">TOTAL TCKS</text>
    </svg>
  )
}

export function ResumenGestionDashboard({ data, activeTab }: { data: ResumenGestionData; activeTab: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { periodo, nombreMes, year, month, total, porEstado, porAplicativo } = data

  const periodos = buildPeriodos()
  const currentValue = `${year}-${month}`

  function handlePeriodo(value: string) {
    const [y, m] = value.split('-')
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', '2')
    p.set('year', y)
    p.set('month', m)
    router.push(`/dashboard?${p.toString()}`)
  }

  const terminados = porEstado['TERMINADO']
  const enProceso = ESTADOS_RESUMEN.filter((e) => e.num >= 1 && e.num <= 5).reduce((s, e) => s + porEstado[e.key], 0)
  const bloqueados = porEstado['OBSERVADO_BLOQUEADO']

  return (
    <div className="space-y-3">

      {/* ═══ HEADER ═══ */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        {/* Título */}
        <div className="bg-[#003087] px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-widest font-medium">Resumen de Gestión</p>
            <h1 className="text-white font-bold text-lg uppercase tracking-wide leading-tight">
              Atención de TCKS y Estado de los Mismos
            </h1>
            <p className="text-blue-300 text-[11px] mt-1">Visión general del estado de atención de tickets</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 min-w-[220px]">
            <svg className="h-5 w-5 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-[9px] uppercase tracking-wide font-semibold mb-0.5">Período</p>
              <div className="relative">
                <select
                  value={currentValue}
                  onChange={(e) => handlePeriodo(e.target.value)}
                  className="w-full appearance-none bg-transparent text-white font-bold text-sm pr-5 outline-none cursor-pointer"
                >
                  {periodos.map((p) => (
                    <option key={p.value} value={p.value} className="text-slate-800 bg-white font-normal">
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-200" />
              </div>
              <p className="text-blue-300 text-[10px] mt-0.5">{periodo}</p>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="bg-[#f8fafc] border-b border-slate-200 px-5 py-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Resumen General</p>
          <div className="grid grid-cols-8 gap-2">
            {/* Total */}
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 flex flex-col items-center shadow-sm">
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide text-center">Total TCKS</p>
              <p className="text-3xl font-bold text-slate-800 mt-0.5">{total}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">100% del total</p>
            </div>
            {/* Estados */}
            {ESTADOS_RESUMEN.map((e) => {
              const count = porEstado[e.key]
              return (
                <div key={e.key} className="rounded-lg border bg-white px-3 py-2.5 flex flex-col items-center shadow-sm"
                  style={{ borderColor: `${e.color}40` }}>
                  <p className="text-[9px] text-slate-500 font-semibold text-center leading-tight">
                    <span className="font-bold" style={{ color: e.color }}>{e.num}.</span> {e.label}
                  </p>
                  <p className="text-2xl font-bold mt-0.5" style={{ color: e.color }}>{count}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pct(count, total)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ CUERPO: Donut + Matriz ═══ */}
      <div className="grid grid-cols-3 gap-3">

        {/* Distribución por estado */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="h-1.5 w-1.5 rounded-full bg-[#003087]" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Distribución de TCKS por Estado</p>
          </div>
          <div className="p-4 flex flex-col items-center gap-3">
            <DonutChart
              data={ESTADOS_RESUMEN.map((e) => ({ key: e.key, count: porEstado[e.key], color: e.color }))}
              total={total}
            />
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#003087]">
                  <th className="px-2 py-1.5 text-left text-[10px] text-white uppercase">Estado</th>
                  <th className="px-2 py-1.5 text-center text-[10px] text-white uppercase">Cant.</th>
                  <th className="px-2 py-1.5 text-center text-[10px] text-white uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ESTADOS_RESUMEN.map((e, i) => (
                  <tr key={e.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                        <span className="text-slate-600">{e.label}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center font-bold text-slate-800">{porEstado[e.key]}</td>
                    <td className="px-2 py-1.5 text-center text-slate-500">{pct(porEstado[e.key], total)}%</td>
                  </tr>
                ))}
                <tr className="bg-[#003087] font-bold">
                  <td className="px-2 py-1.5 text-[10px] text-white uppercase">Total</td>
                  <td className="px-2 py-1.5 text-center text-white">{total}</td>
                  <td className="px-2 py-1.5 text-center text-white">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Matriz por aplicativo */}
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="h-1.5 w-1.5 rounded-full bg-[#003087]" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">TCKS por Aplicación Impactada y Estado</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#003087] text-white">
                  <th className="px-3 py-2 text-left text-[10px] uppercase font-semibold whitespace-nowrap">
                    Aplicación Impactada
                  </th>
                  {ESTADOS_RESUMEN.map((e) => (
                    <th key={e.key} className="px-2 py-2 text-center text-[10px] font-semibold min-w-[80px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold">{e.num}.</span>
                        <span className="text-blue-200 leading-tight text-[9px]">{e.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center text-[10px] uppercase font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porAplicativo.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-xs text-slate-400">
                      Sin datos registrados
                    </td>
                  </tr>
                ) : (
                  porAplicativo.map((ap, i) => (
                    <tr key={ap.codigo} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{ap.nombre}</td>
                      {ESTADOS_RESUMEN.map((e) => {
                        const v = ap.porEstado[e.key]
                        return (
                          <td key={e.key} className="px-2 py-2 text-center">
                            {v > 0 ? (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold"
                                style={{ backgroundColor: e.color }}>
                                {v}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-2 text-center font-bold text-[#003087]">{ap.total}</td>
                    </tr>
                  ))
                )}
                <tr className="bg-[#003087] font-bold text-white">
                  <td className="px-3 py-2 text-[10px] uppercase">Total</td>
                  {ESTADOS_RESUMEN.map((e) => (
                    <td key={e.key} className="px-2 py-2 text-center text-sm">{porEstado[e.key]}</td>
                  ))}
                  <td className="px-2 py-2 text-center text-sm">{total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ INDICADORES CLAVE ═══ */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <div className="h-1.5 w-1.5 rounded-full bg-[#003087]" />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Indicadores Clave</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {/* Terminados */}
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 border-2 border-green-200">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">% TCKS Terminados</p>
              <p className="text-2xl font-bold text-green-600">{pct(terminados, total)}%</p>
              <p className="text-xs text-slate-400">({terminados} de {total})</p>
            </div>
          </div>
          {/* En Proceso */}
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 border-2 border-blue-200">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">% TCKS en Proceso</p>
              <p className="text-2xl font-bold text-blue-600">{pct(enProceso, total)}%</p>
              <p className="text-xs text-slate-400">({enProceso} de {total}) · Estados 1 al 5</p>
            </div>
          </div>
          {/* Bloqueados */}
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 border-2 border-red-200">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">% TCKS Observados/Bloqueados</p>
              <p className="text-2xl font-bold text-red-500">{pct(bloqueados, total)}%</p>
              <p className="text-xs text-slate-400">({bloqueados} de {total})</p>
            </div>
          </div>
          {/* Texto */}
          <div className="flex items-center px-6 py-5 bg-blue-50/40">
            <p className="text-xs text-slate-600 leading-relaxed">
              El <strong className="text-blue-700">{pct(enProceso, total)}%</strong> de los TCKS
              se encuentran en proceso (estados 1 al 5).<br />
              El <strong className="text-green-700">{pct(terminados, total)}%</strong> ya han sido terminados.
              {bloqueados > 0 && (
                <><br /><span className="text-red-600"><strong>{bloqueados}</strong> TCKS requieren atención inmediata.</span></>
              )}
            </p>
          </div>
        </div>

        {/* Leyenda */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-2 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Estados definidos:</span>
          {ESTADOS_RESUMEN.map((e) => (
            <span key={e.key} className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              {e.num}. {e.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
