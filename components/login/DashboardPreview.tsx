import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  PlayCircle,
  Bug,
  KanbanSquare,
  BarChart3,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FileText, label: 'Requerimientos' },
  { icon: ClipboardCheck, label: 'Casos de Prueba' },
  { icon: PlayCircle, label: 'Ejecución' },
  { icon: Bug, label: 'Defectos' },
  { icon: KanbanSquare, label: 'Planner' },
  { icon: BarChart3, label: 'Reportes' },
  { icon: Settings, label: 'Configuración' },
]

const KPIS = [
  { label: 'Requerimientos', value: '128', delta: '+12%', up: true },
  { label: 'Casos de Prueba', value: '320', delta: '+8%', up: true },
  { label: 'Ejecuciones', value: '452', delta: '+15%', up: true },
  { label: 'Defectos Abiertos', value: '32', delta: '-6%', up: false },
]

const DONUT = [
  { label: 'Completadas', value: 250, color: '#22C55E' },
  { label: 'En Progreso', value: 45, color: '#2563EB' },
  { label: 'No Ejecutadas', value: 25, color: '#EF4444' },
]

const BARS = [
  { label: 'Abiertos', value: 52, color: '#8B5CF6' },
  { label: 'En Progreso', value: 38, color: '#EF4444' },
  { label: 'Resueltos', value: 44, color: '#2563EB' },
  { label: 'Cerrados', value: 30, color: '#22C55E' },
]

function Donut() {
  const total = DONUT.reduce((s, d) => s + d.value, 0)
  const r = 34
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative h-[104px] w-[104px] shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1C2942" strokeWidth="11" />
        {DONUT.map((d) => {
          const len = (d.value / total) * c
          const seg = (
            <circle
              key={d.label}
              cx="44"
              cy="44"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">78%</span>
        <span className="text-[9px] text-[#A7B3C7]">Completado</span>
      </div>
    </div>
  )
}

export function DashboardPreview() {
  const maxBar = Math.max(...BARS.map((b) => b.value))
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1728]/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-sm">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[148px] shrink-0 flex-col gap-0.5 border-r border-white/[0.06] bg-[#0A1322] p-3 sm:flex">
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2563EB]">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold text-white">QA Control</span>
          </div>
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <div
                key={n.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                  n.active
                    ? 'bg-[#2563EB]/15 font-medium text-white ring-1 ring-[#2563EB]/30'
                    : 'text-[#A7B3C7]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${n.active ? 'text-[#60A5FA]' : 'text-[#6B7A93]'}`} />
                <span className="truncate">{n.label}</span>
              </div>
            )
          })}
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Resumen General</span>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#121C2F] px-2.5 py-1 text-[10px] text-[#A7B3C7]">
              COFIDE — Core Bancario
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-white/[0.06] bg-[#121C2F] p-2.5"
              >
                <p className="truncate text-[9px] text-[#A7B3C7]">{k.label}</p>
                <p className="mt-0.5 text-lg font-bold leading-none text-white">{k.value}</p>
                <p
                  className={`mt-1 text-[9px] font-medium ${
                    k.up ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {k.delta} vs anterior
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-[#121C2F] p-3">
              <p className="mb-2 text-[10px] font-medium text-white">Ejecución de Pruebas</p>
              <div className="flex items-center gap-3">
                <Donut />
                <ul className="space-y-1.5">
                  {DONUT.map((d) => (
                    <li key={d.label} className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-[#A7B3C7]">{d.label}</span>
                      <span className="ml-auto font-medium text-white">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#121C2F] p-3">
              <p className="mb-2 text-[10px] font-medium text-white">Defectos por Estado</p>
              <div className="flex h-[104px] items-end justify-between gap-2 px-1">
                {BARS.map((b) => (
                  <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${(b.value / maxBar) * 100}%`,
                          background: `linear-gradient(180deg, ${b.color}, ${b.color}99)`,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-[#A7B3C7]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
