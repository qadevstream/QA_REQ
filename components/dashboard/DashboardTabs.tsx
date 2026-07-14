'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart2, ClipboardList, Gauge } from 'lucide-react'

interface Props {
  dashboard1: React.ReactNode
  dashboard2: React.ReactNode
  dashboard3: React.ReactNode
  defaultTab: string
  /** El tab "Dashboard Operativo QA" solo lo ven Analista QA y Administrador. */
  showOperativo: boolean
}

// Pestañas del Dashboard. 'op' = vista Operativo QA (solo Analista/Admin),
// '1' = Dashboard Ejecutivo, '2' = Resumen de Gestión.
// Nota: Resumen de Gestión depende de tab '2' para su selector de período,
// por eso se conservan esos ids.
export function DashboardTabs({ dashboard1, dashboard2, dashboard3, defaultTab, showOperativo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? defaultTab
  let active = tab === '1' ? 'ejecutivo' : tab === '2' ? 'resumen' : 'operativo'
  // Si no tiene permiso al Operativo, cae al Ejecutivo (aunque llegue con ?tab=op).
  if (active === 'operativo' && !showOperativo) active = 'ejecutivo'

  function setTab(t: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', t)
    // El período (year/month) solo lo usa Resumen de Gestión ('2').
    if (t !== '2') { p.delete('year'); p.delete('month') }
    router.push(`/dashboard?${p.toString()}`)
  }

  const tabClass = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
     ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        {showOperativo && (
          <button onClick={() => setTab('op')} className={tabClass(active === 'operativo')}>
            <Gauge className="h-4 w-4" />
            Dashboard Operativo QA
          </button>
        )}
        <button onClick={() => setTab('1')} className={tabClass(active === 'ejecutivo')}>
          <BarChart2 className="h-4 w-4" />
          Dashboard Ejecutivo
        </button>
        <button onClick={() => setTab('2')} className={tabClass(active === 'resumen')}>
          <ClipboardList className="h-4 w-4" />
          Resumen de Gestión
        </button>
      </div>
      <div>{active === 'ejecutivo' ? dashboard1 : active === 'resumen' ? dashboard2 : dashboard3}</div>
    </div>
  )
}
