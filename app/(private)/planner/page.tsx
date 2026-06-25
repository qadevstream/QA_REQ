import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllActividades } from '@/server/repositories/actividades.repository'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { findRequirementsSummary } from '@/server/repositories/requirements.repository'
import { KanbanBoard } from '@/components/actividades/KanbanBoard'

export const metadata: Metadata = { title: 'Planner' }

export default async function PlannerPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [actividades, analistas, aplicativos, requirements] = await Promise.all([
    findAllActividades(),
    findAnalistas(),
    findAllAplicativos(),
    findRequirementsSummary(),
  ])

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <KanbanBoard initialActividades={actividades} analistas={analistas} aplicativos={aplicativos} requirements={requirements} />
    </div>
  )
}
