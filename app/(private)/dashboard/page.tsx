import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDashboardMetrics } from '@/server/usecases/getDashboardMetrics'
import { getResumenGestion } from '@/server/usecases/getResumenGestion'
import { getTendenciaDiaria } from '@/server/usecases/getTendenciaDiaria'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllRegistroDiario } from '@/server/repositories/registroDiario.repository'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { KPIGrid } from '@/components/dashboard/KPIGrid'
import { ChartByStatus } from '@/components/dashboard/ChartByStatus'
import { ChartByQA } from '@/components/dashboard/ChartByQA'
import { ChartByApp } from '@/components/dashboard/ChartByApp'
import { ChartTendencia } from '@/components/dashboard/ChartTendencia'
import { ResumenGestionDashboard } from '@/components/dashboard/ResumenGestionDashboard'
import { ControlHorasDashboard } from '@/components/dashboard/ControlHorasDashboard'
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
  if (session.profile.role === 'CLIENTE') redirect('/requirements')

  // El Dashboard Operativo QA (Control de Horas) solo lo ven Analista QA y Administrador.
  const canVerOperativo = session.profile.role === 'ANALISTA_QA' || session.profile.role === 'ADMINISTRADOR'

  const params = await searchParams
  const year  = params.year  ? parseInt(params.year)  : undefined
  const month = params.month ? parseInt(params.month) : undefined

  const [metrics, resumen, tendencia, registrosHoras, analistasHoras, aplicativosHoras] = await Promise.all([
    getDashboardMetrics(),
    getResumenGestion(year, month),
    getTendenciaDiaria(),
    findAllRegistroDiario({}),
    findAnalistas(),
    findAllAplicativos(),
  ])

  const dashboard1 = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vista gerencial del estado del área QA · {formatDate(new Date().toISOString().slice(0, 10))}
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

  const dashboard3 = canVerOperativo ? (
    <ControlHorasDashboard
      registros={registrosHoras}
      analistas={analistasHoras}
      aplicativos={aplicativosHoras}
      fecha={formatDate(new Date().toISOString().slice(0, 10))}
    />
  ) : null

  return (
    <div className="px-8 py-6">
      <DashboardTabs
        dashboard1={dashboard1}
        dashboard2={dashboard2}
        dashboard3={dashboard3}
        defaultTab={params.tab ?? (canVerOperativo ? 'op' : '1')}
        showOperativo={canVerOperativo}
      />
    </div>
  )
}
