import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { RequirementCreateForm } from '@/components/requirements/RequirementCreateForm'

export const metadata: Metadata = { title: 'Nuevo Requerimiento' }

export default async function NewRequirementPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const [analistas, aplicativos] = await Promise.all([
    findAnalistas(),
    findAllAplicativos(),
  ])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <RequirementCreateForm analistas={analistas} aplicativos={aplicativos} />
    </div>
  )
}
