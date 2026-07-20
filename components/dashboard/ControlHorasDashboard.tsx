'use client'

import { useMemo, useState } from 'react'
import {
  Clock, Target, TrendingUp, AlertTriangle, Zap, Gauge, CalendarDays,
  Users, Boxes, PieChart as PieIcon, ListChecks, Search, ChevronRight,
  ChevronDown, Table2, ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RegistroDiario, Profile, AplicativoCatalogo, CatFeriado } from '@/types/domain.types'
import {
  HEADER_GRADIENT, HEADER_GLASS, BAR_FILL, BRAND, KPI_ACCENTS, type KpiAccent,
} from '@/lib/dashboardTheme'
import { META_CONFIG, TIPO_PALETTE, cumplimientoAccent, calcularMetaPeriodo } from '@/lib/controlHoras'
import { PERIODOS } from '@/lib/constants'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtH = (n: number) => n.toFixed(2)
const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
function fechaCorta(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_ABR[d.getMonth()]}`
}

// ── Subcomponentes de presentación ───────────────────────────────────────────
function KpiTile({ title, value, unit, description, icon: Icon, accent }: {
  title: string; value: string | number; unit?: string; description?: string; icon: LucideIcon; accent: KpiAccent
}) {
  const a = KPI_ACCENTS[accent]
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: a.bar }} />
      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: a.text }}>{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </p>
          {description && <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: a.chip }}>
          <Icon className="h-5 w-5" style={{ color: a.icon }} />
        </div>
      </div>
    </div>
  )
}

function PanelCard({ title, subtitle, icon: Icon, children, className = '' }: {
  title: string; subtitle?: string; icon: LucideIcon; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: BRAND.blueSoft }}>
          <Icon className="h-4 w-4" style={{ color: BRAND.blue }} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function BarList({ items }: { items: { label: string; sub?: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p className="py-6 text-center text-xs text-slate-400">Sin datos</p>
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0">
            <p className="truncate text-xs font-medium text-slate-700" title={it.label}>{it.label}</p>
            {it.sub && <p className="truncate text-[10px] text-slate-400">{it.sub}</p>}
          </div>
          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
              style={{ width: `${(it.value / max) * 100}%`, background: BAR_FILL }} />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-slate-700">{fmtH(it.value)}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const R = 52, cx = 70, cy = 70, circ = 2 * Math.PI * R
  let cum = 0
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        {total === 0
          ? <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e8f0" strokeWidth="16" />
          : items.filter((i) => i.value > 0).map((s, idx) => {
            const ratio = s.value / total
            const dash = ratio * circ
            const off = circ - cum * circ
            cum += ratio
            return (
              <circle key={idx} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth="16"
                strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off}
                transform={`rotate(-90 ${cx} ${cy})`} />
            )
          })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a">{fmtH(total)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#64748b">HORAS</text>
      </svg>
      <div className="grid w-full grid-cols-1 gap-1">
        {items.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 truncate text-slate-600" title={s.label}>{s.label}</span>
            <span className="tabular-nums font-semibold text-slate-700">
              {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Interpolación cúbica monótona (Fritsch–Carlson): suaviza la línea sin que
// la curva se pase de los valores reales. Una spline normal (Catmull-Rom)
// haría "panza" y en una caída fuerte —como la del 10 Jul— dibujaría horas
// por debajo de las que realmente se registraron.
function pathSuave(pts: { x: number; y: number }[]): string {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${pts[0].x},${pts[0].y}`
  if (n === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`

  const dx: number[] = [], pend: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x
    pend[i] = (pts[i + 1].y - pts[i].y) / dx[i]
  }

  const m: number[] = [pend[0]]
  for (let i = 1; i < n - 1; i++) {
    // Si la pendiente cambia de signo, la tangente se aplana: eso es lo que
    // impide el sobretiro en los picos y valles.
    if (pend[i - 1] * pend[i] <= 0) { m[i] = 0; continue }
    const w1 = 2 * dx[i] + dx[i - 1]
    const w2 = dx[i] + 2 * dx[i - 1]
    m[i] = (w1 + w2) / (w1 / pend[i - 1] + w2 / pend[i])
  }
  m[n - 1] = pend[n - 2]

  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i] / 3
    d += ` C${pts[i].x + t},${pts[i].y + m[i] * t} ${pts[i + 1].x - t},${pts[i + 1].y - m[i + 1] * t} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
}

function LineRealMeta({ dias, meta }: { dias: { fecha: string; horas: number }[]; meta: number }) {
  const n = dias.length
  // El ancho crece con los puntos para que las etiquetas de horas nunca se
  // encimen (~34 px por punto). El contenedor tiene scroll horizontal.
  const W = Math.max(560, n * 34), H = 190, pad = 28
  const padTop = 34   // aire extra arriba para la etiqueta del punto más alto
  const maxY = Math.max(meta, ...dias.map((d) => d.horas), 1) * 1.15
  const x = (i: number) => pad + (n <= 1 ? 0 : (i * (W - pad * 2)) / (n - 1))
  const y = (v: number) => H - pad - (v / maxY) * (H - pad - padTop)
  const pts = dias.map((d, i) => ({ x: x(i), y: y(d.horas) }))
  if (n === 0) return <p className="py-8 text-center text-xs text-slate-400">Sin datos</p>
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: Math.min(W, 900) }}>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={padTop + g * (H - pad - padTop)} y2={padTop + g * (H - pad - padTop)}
            stroke="#eef2f7" strokeWidth="1" />
        ))}
        {/* meta */}
        <line x1={pad} x2={W - pad} y1={y(meta)} y2={y(meta)} stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 5" />
        {/* real */}
        <path d={pathSuave(pts)} fill="none" stroke={BRAND.blue} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {dias.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.horas)} r="3" fill={BRAND.navy} />)}
        {/* horas en cada punto */}
        {dias.map((d, i) => (
          <text key={`h${i}`} x={x(i)} y={y(d.horas) - 9} textAnchor="middle" fontSize="7.5"
            fill="#64748b" className="tabular-nums font-semibold">
            {d.horas.toFixed(2)}
          </text>
        ))}
        {dias.map((d, i) => (i % Math.ceil(n / 8 || 1) === 0
          ? <text key={`t${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="#94a3b8">{fechaCorta(d.fecha)}</text>
          : null))}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded" style={{ background: BRAND.blue }} /> Horas reales</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3" style={{ background: '#94A3B8' }} /> Meta diaria</span>
      </div>
    </div>
  )
}

function SemaforoRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
interface Props {
  registros: RegistroDiario[]
  analistas: Profile[]
  aplicativos: AplicativoCatalogo[]
  feriados: CatFeriado[]
  fecha: string
}

export function ControlHorasDashboard({ registros, analistas, aplicativos, feriados, fecha }: Props) {
  const [fAnalista, setFAnalista] = useState('')
  const [fPeriodo, setFPeriodo] = useState('')
  const [fTicket, setFTicket] = useState('')
  const [q, setQ] = useState('')
  const [expAnalistas, setExpAnalistas] = useState<Set<string>>(new Set())
  const [expTickets, setExpTickets] = useState<Set<string>>(new Set())

  const appNombre = useMemo(() => {
    const m = new Map<string, string>()
    aplicativos.forEach((a) => m.set(a.codigo, a.nombre))
    return m
  }, [aplicativos])

  // Orden cronológico de los períodos usando el catálogo PERIODOS (fecha "from").
  const periodoDesde = useMemo(() => {
    const m = new Map<string, string>()
    PERIODOS.forEach((p) => m.set(p.value, p.from))
    return m
  }, [])

  const periodosDisponibles = useMemo(() => {
    const set = [...new Set(registros.map((r) => r.periodo).filter(Boolean))] as string[]
    // Más reciente primero.
    return set.sort((a, b) => (periodoDesde.get(b) ?? b).localeCompare(periodoDesde.get(a) ?? a))
  }, [registros, periodoDesde])
  const ticketsDisponibles = useMemo(
    () => [...new Set(registros.map((r) => r.nro_ticket).filter(Boolean))] as string[],
    [registros],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return registros.filter((r) => {
      if (fAnalista && r.qa_id !== fAnalista) return false
      if (fPeriodo && r.periodo !== fPeriodo) return false
      if (fTicket && r.nro_ticket !== fTicket) return false
      if (needle) {
        const hay = [r.aplicativo, r.codigo_app, r.tipo_tarea, r.nro_ticket, r.observaciones, r.qa?.full_name]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [registros, fAnalista, fPeriodo, fTicket, q])

  // ── Agregaciones ──
  const agg = useMemo(() => {
    const totalHoras = rows.reduce((s, r) => s + r.horas_ejecutadas, 0)

    const byMap = (keyFn: (r: RegistroDiario) => string | null) => {
      const m = new Map<string, number>()
      rows.forEach((r) => { const k = keyFn(r); if (k) m.set(k, (m.get(k) ?? 0) + r.horas_ejecutadas) })
      return m
    }

    const porAnalistaMap = new Map<string, { name: string; horas: number }>()
    rows.forEach((r) => {
      const id = r.qa_id ?? 'sin'
      const cur = porAnalistaMap.get(id) ?? { name: r.qa?.full_name ?? 'Sin asignar', horas: 0 }
      cur.horas += r.horas_ejecutadas
      porAnalistaMap.set(id, cur)
    })
    const porAnalista = [...porAnalistaMap.values()].sort((a, b) => b.horas - a.horas)

    const porApp = [...byMap((r) => r.aplicativo).entries()]
      .map(([codigo, horas]) => ({ label: codigo, sub: appNombre.get(codigo) ?? undefined, value: horas }))
      .sort((a, b) => b.value - a.value)

    const porTipoArr = [...byMap((r) => r.tipo_tarea).entries()].sort((a, b) => b[1] - a[1])
    const porTipo = porTipoArr.map(([label, value], i) => ({ label, value, color: TIPO_PALETTE[i % TIPO_PALETTE.length] }))

    const porDiaMap = byMap((r) => r.fecha_reporte)
    const dias = [...porDiaMap.entries()].map(([fecha, horas]) => ({ fecha, horas })).sort((a, b) => a.fecha.localeCompare(b.fecha))

    const tickets = [...byMap((r) => r.nro_ticket).entries()]
      .map(([ticket, horas]) => ({ ticket, horas })).sort((a, b) => b.horas - a.horas)

    const numAnalistas = new Set(rows.map((r) => r.qa_id).filter(Boolean)).size || 1

    // La meta sale de los días hábiles reales de cada período presente en los
    // datos filtrados, descontando feriados. Con un período seleccionado es el
    // de ese período; sin filtro, la suma de todos los que aparecen.
    const periodosEnRows = [...new Set(rows.map((r) => r.periodo).filter(Boolean))] as string[]
    const metas = periodosEnRows.map((p) => calcularMetaPeriodo(p, feriados))
    const horasPorAnalista = metas.reduce((s, m) => s + m.horasPorAnalista, 0)
    const diasHabiles = metas.reduce((s, m) => s + m.diasHabiles, 0)
    const feriadosDelRango = metas.flatMap((m) => m.feriados)

    const metaMensual = horasPorAnalista * numAnalistas
    const cumplimiento = metaMensual > 0 ? (totalHoras / metaMensual) * 100 : 0
    const horasFaltantes = Math.max(0, metaMensual - totalHoras)

    // Horas extra = suma de (horas por analista/día por encima de la meta diaria)
    const perAnalistaDia = new Map<string, number>()
    rows.forEach((r) => {
      const k = `${r.qa_id}|${r.fecha_reporte}`
      perAnalistaDia.set(k, (perAnalistaDia.get(k) ?? 0) + r.horas_ejecutadas)
    })
    let horasExtra = 0
    perAnalistaDia.forEach((h) => { if (h > META_CONFIG.diariaPorAnalista) horasExtra += h - META_CONFIG.diariaPorAnalista })

    const diasConRegistro = dias.length || 1
    const promedioDiario = totalHoras / diasConRegistro
    const proyeccionEstimada = promedioDiario * diasHabiles
    const proyeccionCierre = metaMensual > 0 ? (proyeccionEstimada / metaMensual) * 100 : 0
    const metaDiariaEquipo = META_CONFIG.diariaPorAnalista * numAnalistas

    return {
      totalHoras, porAnalista, porApp, porTipo, dias, tickets,
      numAnalistas, metaMensual, cumplimiento, horasFaltantes, horasExtra,
      promedioDiario, proyeccionEstimada, proyeccionCierre, metaDiariaEquipo,
      horasPorAnalista, diasHabiles, feriadosDelRango,
    }
  }, [rows, appNombre, feriados])

  // ── Matriz jerárquica: analista → ticket → tipo tarea × fecha ──
  const matriz = useMemo(() => {
    const fechas = [...new Set(rows.map((r) => r.fecha_reporte))].sort()
    type Node = { key: string; label: string; por: Map<string, number>; total: number }
    const analistasMap = new Map<string, {
      node: Node
      tickets: Map<string, { node: Node; tareas: Map<string, Node> }>
    }>()
    const add = (por: Map<string, number>, fecha: string, h: number) => por.set(fecha, (por.get(fecha) ?? 0) + h)

    rows.forEach((r) => {
      const aId = r.qa_id ?? 'sin'
      const aName = r.qa?.full_name ?? 'Sin asignar'
      const tk = r.nro_ticket || 'Sin ticket'
      const ta = r.tipo_tarea || 'Sin tipo'
      let a = analistasMap.get(aId)
      if (!a) { a = { node: { key: aId, label: aName, por: new Map(), total: 0 }, tickets: new Map() }; analistasMap.set(aId, a) }
      add(a.node.por, r.fecha_reporte, r.horas_ejecutadas); a.node.total += r.horas_ejecutadas
      let t = a.tickets.get(tk)
      if (!t) { t = { node: { key: `${aId}|${tk}`, label: tk, por: new Map(), total: 0 }, tareas: new Map() }; a.tickets.set(tk, t) }
      add(t.node.por, r.fecha_reporte, r.horas_ejecutadas); t.node.total += r.horas_ejecutadas
      let leaf = t.tareas.get(ta)
      if (!leaf) { leaf = { key: `${aId}|${tk}|${ta}`, label: ta, por: new Map(), total: 0 }; t.tareas.set(ta, leaf) }
      add(leaf.por, r.fecha_reporte, r.horas_ejecutadas); leaf.total += r.horas_ejecutadas
    })

    const analistas = [...analistasMap.values()]
      .map((a) => ({
        node: a.node,
        tickets: [...a.tickets.values()]
          .map((t) => ({ node: t.node, tareas: [...t.tareas.values()].sort((x, y) => y.total - x.total) }))
          .sort((x, y) => y.node.total - x.node.total),
      }))
      .sort((x, y) => y.node.total - x.node.total)

    const totalPorDia = new Map<string, number>()
    fechas.forEach((f) => totalPorDia.set(f, rows.filter((r) => r.fecha_reporte === f).reduce((s, r) => s + r.horas_ejecutadas, 0)))
    return { fechas, analistas, totalPorDia }
  }, [rows])

  const detalle = useMemo(
    () => [...rows]
      .sort((a, b) => b.fecha_reporte.localeCompare(a.fecha_reporte) || b.horas_ejecutadas - a.horas_ejecutadas)
      .slice(0, 10),
    [rows],
  )

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const n = new Set(set); n.has(key) ? n.delete(key) : n.add(key); setFn(n)
  }

  const cAccent = cumplimientoAccent(agg.cumplimiento)
  const cColor = KPI_ACCENTS[cAccent]

  const cell = (v: number | undefined) => v ? <span className="tabular-nums text-slate-700">{fmtH(v)}</span> : <span className="text-slate-300">-</span>

  const inputCls = 'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{ background: HEADER_GRADIENT }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: HEADER_GLASS }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4 px-7 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Gauge className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">Dashboard Gerencial QA · Control de Horas</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">Consumo de horas por tickets y cumplimiento de meta</h1>
              <p className="text-sm text-white/70">Basado en la Bitácora de Actividades (Registro Diario)</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 ring-1 ring-white/20 backdrop-blur-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-white/80" />
              <div className="leading-tight">
                <label className="block text-[9px] font-semibold uppercase tracking-widest text-white/60">Período</label>
                <div className="relative">
                  <select
                    value={fPeriodo}
                    onChange={(e) => setFPeriodo(e.target.value)}
                    className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-bold text-white outline-none"
                  >
                    <option value="" className="text-slate-800">Todos los períodos</option>
                    {periodosDisponibles.map((p) => <option key={p} value={p} className="text-slate-800">{p}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-white/50">Actualizado {fecha}</span>
          </div>
        </div>
      </div>

      {/* ═══ FILTROS (sticky) ═══ */}
      <div className="sticky top-0 z-20 rounded-2xl border border-slate-200/70 bg-white/85 p-3 shadow-sm backdrop-blur-md">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Analista</label>
            <select value={fAnalista} onChange={(e) => setFAnalista(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {analistas.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ticket</label>
            <select value={fTicket} onChange={(e) => setFTicket(e.target.value)} className={inputCls}>
              <option value="">Todos</option>
              {ticketsDisponibles.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Buscador general</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar aplicación, tarea o solicitud"
                className={`${inputCls} pl-9`} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPIs ═══ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile title="Horas ejecutadas" value={fmtH(agg.totalHoras)} unit="h" description="Acumulado" icon={Clock} accent="info" />
        <KpiTile title="Meta mensual" value={fmtH(agg.metaMensual)} unit="h" description={`${fmtH(agg.horasPorAnalista)} h × ${agg.numAnalistas} analista(s)`} icon={Target} accent="info" />
        <div className="group relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ borderColor: `${cColor.bar}55`, backgroundColor: cColor.chip }}>
          <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: cColor.bar }} />
          <div className="flex items-start justify-between gap-3 p-4 pl-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cumplimiento</p>
              <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: cColor.text }}>{agg.cumplimiento.toFixed(1)}%</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Avance vs meta</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
              <TrendingUp className="h-5 w-5" style={{ color: cColor.icon }} />
            </div>
          </div>
        </div>
        <KpiTile title="Horas faltantes" value={fmtH(agg.horasFaltantes)} unit="h" description="Para llegar a meta" icon={AlertTriangle} accent="warning" />
        <KpiTile title="Horas extra" value={fmtH(agg.horasExtra)} unit="h" description="Sobre meta diaria" icon={Zap} accent="success" />
      </div>
      <p className="-mt-1 px-1 text-[11px] text-slate-400">
        ⚙️ Meta = {agg.diasHabiles} día(s) hábil(es) × {META_CONFIG.diariaPorAnalista} h × {agg.numAnalistas} analista(s).
        {agg.feriadosDelRango.length > 0 ? (
          <> Descuenta {agg.feriadosDelRango.length} feriado(s): {agg.feriadosDelRango.map((f) => f.nombre).join(', ')}.</>
        ) : (
          <> Sin feriados en el rango.</>
        )}
        {' '}Los feriados se administran en Mantenimiento.
      </p>

      {/* ═══ Fila: Horas por analista + Semáforo ═══ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard title="Horas por analista" icon={Users} className="lg:col-span-2">
          <BarList items={agg.porAnalista.map((a) => ({ label: a.name, value: a.horas }))} />
        </PanelCard>
        <PanelCard title="Semáforo de gestión" icon={Gauge}>
          <div className="space-y-3">
            <SemaforoRow label="Cumplimiento mensual" pct={agg.cumplimiento} color={cColor.bar} />
            <SemaforoRow label="Proyección de cierre" pct={agg.proyeccionCierre} color={BRAND.blue} />
            <SemaforoRow label="Déficit diario controlado" pct={0} color="#10B981" />
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proyección estimada</p>
              <p className="text-xl font-bold text-slate-800">{fmtH(agg.proyeccionEstimada)} h</p>
              <p className="text-[11px] text-slate-400">Promedio diario × {agg.diasHabiles} días hábiles</p>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* ═══ Fila: Horas por aplicación + Distribución por tipo ═══ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Horas por aplicación" icon={Boxes}>
          <BarList items={agg.porApp.slice(0, 10)} />
        </PanelCard>
        <PanelCard title="Distribución por tipo de tarea" subtitle="Consumo de horas por tipo" icon={PieIcon}>
          <Donut items={agg.porTipo.slice(0, 8)} />
        </PanelCard>
      </div>

      {/* ═══ Fila: real vs meta + tickets ═══ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard title="Cumplimiento diario: real vs meta" icon={TrendingUp} className="lg:col-span-2">
          <LineRealMeta dias={agg.dias} meta={agg.metaDiariaEquipo} />
        </PanelCard>
        <PanelCard title="Tickets con mayor consumo" icon={ListChecks}>
          <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
            {agg.tickets.slice(0, 10).map((t, i) => (
              <div key={t.ticket} className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: BRAND.blue }}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700">Ticket {t.ticket}</p>
                  <p className="text-[10px] text-slate-400">Consumo acumulado</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">{fmtH(t.horas)} h</span>
              </div>
            ))}
            {agg.tickets.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Sin datos</p>}
          </div>
        </PanelCard>
      </div>

      {/* ═══ Matriz jerárquica ═══ */}
      <PanelCard title="Matriz jerárquica por período, analista, ticket y tipo de tarea" subtitle="Columnas por fecha · Filas: Analista → Ticket → Tipo de tarea" icon={Table2}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#003087] text-white">
                <th className="sticky left-0 z-10 bg-[#003087] px-3 py-2 text-left font-semibold">Jerarquía</th>
                {matriz.fechas.map((f) => (
                  <th key={f} className="whitespace-nowrap px-2 py-2 text-center font-semibold">{fechaCorta(f)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matriz.analistas.map((a) => {
                const aOpen = expAnalistas.has(a.node.key)
                return (
                  <>
                    <tr key={a.node.key} className="border-b border-slate-100 bg-blue-50/40 hover:bg-blue-50">
                      <td className="sticky left-0 z-10 bg-blue-50/70 px-3 py-1.5">
                        <button onClick={() => toggle(expAnalistas, setExpAnalistas, a.node.key)} className="flex items-center gap-1.5 font-bold text-slate-800">
                          {aOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {a.node.label}
                        </button>
                      </td>
                      {matriz.fechas.map((f) => <td key={f} className="px-2 py-1.5 text-center font-semibold">{cell(a.node.por.get(f))}</td>)}
                    </tr>
                    {aOpen && a.tickets.map((t) => {
                      const tOpen = expTickets.has(t.node.key)
                      return (
                        <>
                          <tr key={t.node.key} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="sticky left-0 z-10 bg-white px-3 py-1.5 pl-8">
                              <button onClick={() => toggle(expTickets, setExpTickets, t.node.key)} className="flex items-center gap-1.5 font-medium text-slate-600">
                                {tOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                {t.node.label}
                              </button>
                            </td>
                            {matriz.fechas.map((f) => <td key={f} className="px-2 py-1.5 text-center">{cell(t.node.por.get(f))}</td>)}
                          </tr>
                          {tOpen && t.tareas.map((leaf) => (
                            <tr key={leaf.key} className="border-b border-slate-50 text-slate-500 hover:bg-slate-50">
                              <td className="sticky left-0 z-10 bg-white px-3 py-1.5 pl-14 text-[11px]">{leaf.label}</td>
                              {matriz.fechas.map((f) => <td key={f} className="px-2 py-1.5 text-center text-[11px]">{cell(leaf.por.get(f))}</td>)}
                            </tr>
                          ))}
                        </>
                      )
                    })}
                  </>
                )
              })}
              {matriz.analistas.length === 0 && (
                <tr><td colSpan={matriz.fechas.length + 1} className="py-6 text-center text-slate-400">Sin datos</td></tr>
              )}
            </tbody>
            {matriz.analistas.length > 0 && (
              <tfoot>
                <tr className="bg-[#003087] font-bold text-white">
                  <td className="sticky left-0 z-10 bg-[#003087] px-3 py-2">TOTAL POR DÍA</td>
                  {matriz.fechas.map((f) => <td key={f} className="px-2 py-2 text-center">{fmtH(matriz.totalPorDia.get(f) ?? 0)}</td>)}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Columna de jerarquía fija · Scroll horizontal habilitado</p>
      </PanelCard>

      {/* ═══ Detalle de registros ═══ */}
      <PanelCard title="Detalle de registros" subtitle="Últimos 10 registros (fecha descendente)" icon={ClipboardList}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="bg-[#003087] text-[10px] uppercase tracking-wide text-white">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Analista</th>
                <th className="px-3 py-2 text-left">Aplicación</th>
                <th className="px-3 py-2 text-left">Solicitud</th>
                <th className="px-3 py-2 text-center">Horas</th>
                <th className="px-3 py-2 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalle.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{fechaCorta(r.fecha_reporte)}</td>
                  <td className="px-3 py-2 font-medium text-slate-700">{r.qa?.full_name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-700">{r.aplicativo ?? '—'}</span>
                    {r.aplicativo && appNombre.get(r.aplicativo) && <span className="block text-[10px] text-slate-400">{appNombre.get(r.aplicativo)}</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.tipo_tarea ?? '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{fmtH(r.horas_ejecutadas)} h</span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-500">{r.nro_ticket ?? '—'}</td>
                </tr>
              ))}
              {detalle.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Visualización limitada a los 10 registros más recientes</p>
      </PanelCard>
    </div>
  )
}
