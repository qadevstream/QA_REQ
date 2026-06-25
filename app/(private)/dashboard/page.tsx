import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDashboardMetrics } from '@/server/usecases/getDashboardMetrics'
import { getResumenGestion } from '@/server/usecases/getResumenGestion'
import { getTendenciaDiaria } from '@/server/usecases/getTendenciaDiaria'
import { getCurrentUser } from '@/server/actions/auth'
import { KPIGrid } from '@/components/dashboard/KPIGrid'
import { ChartByStatus } from '@/components/dashboard/ChartByStatus'
import { ChartByQA } from '@/components/dashboard/ChartByQA'
import { ChartByApp } from '@/components/dashboard/ChartByApp'
import { ChartTendencia } from '@/components/dashboard/ChartTendencia'
import { ResumenGestionDashboard } from '@/components/dashboard/ResumenGestionDashboard'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
export const revalidate = 300 // caché 5 minutos

interface Props {
  searchParams: Promise<{ tab?: string; year?: string; month?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') redirect('/requirements')

  const params = await searchParams
  const year  = params.year  ? parseInt(params.year)  : undefined
  const month = params.month ? parseInt(params.month) : undefined

  const [metrics, resumen, tendencia] = await Promise.all([
    getDashboardMetrics(),
    getResumenGestion(year, month),
    getTendenciaDiaria(),
  ])

  const dashboard1 = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vista gerencial del estado del área QA · {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
      <KPIGrid metrics={metrics} />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartByStatus data={metrics.by_estado} />
        <ChartByQA data={metrics.by_qa} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartByApp data={metrics.by_aplicativo} />
        <ChartTendencia data={tendencia} />
      </div>
    </div>
  )

  const dashboard2 = (
    <ResumenGestionDashboard
      data={resumen}
      activeTab={params.tab ?? '1'}
    />
  )

  return (
    <div className="px-8 py-6">
      <DashboardTabs
        dashboard1={dashboard1}
        dashboard2={dashboard2}
        defaultTab={params.tab ?? '1'}
      />
    </div>
  )
}
