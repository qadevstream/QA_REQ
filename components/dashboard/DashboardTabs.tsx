'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart2, ClipboardList } from 'lucide-react'

interface Props {
  dashboard1: React.ReactNode
  dashboard2: React.ReactNode
  defaultTab: string
}

export function DashboardTabs({ dashboard1, dashboard2, defaultTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? defaultTab

  function setTab(t: string) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', t)
    // Al cambiar de tab, limpiar filtros de período
    if (t === '1') { p.delete('year'); p.delete('month') }
    router.push(`/dashboard?${p.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('1')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
            ${tab !== '2' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart2 className="h-4 w-4" />
          Dashboard Ejecutivo
        </button>
        <button
          onClick={() => setTab('2')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
            ${tab === '2' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <ClipboardList className="h-4 w-4" />
          Resumen de Gestión
        </button>
      </div>
      <div>{tab === '2' ? dashboard2 : dashboard1}</div>
    </div>
  )
}
