import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllRequirements } from '@/server/repositories/requirements.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { ReporteSemanalTable } from '@/components/reportes/ReporteSemanalTable'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [requirements, aplicativos] = await Promise.all([
    findAllRequirements(),
    findAllAplicativos(),
  ])

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los requerimientos con sus iteraciones
        </p>
      </div>
      <ReporteSemanalTable requirements={requirements} aplicativos={aplicativos} />
    </div>
  )
}
