import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllRegistroDiario } from '@/server/repositories/registroDiario.repository'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { findAllCatTipoTareas } from '@/server/repositories/catTipoTarea.repository'
import { findRequirementsSummary } from '@/server/repositories/requirements.repository'
import { RegistroDiarioManager } from '@/components/actividades/RegistroDiarioManager'

export const metadata: Metadata = { title: 'Actividades' }

export default async function ActividadesPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const isSupervisor = session.profile.role === 'SUPERVISOR' || session.profile.role === 'ADMINISTRADOR'

  const [registros, analistas, aplicativos, tiposTarea, requirements] = await Promise.all([
    findAllRegistroDiario(isSupervisor ? {} : { qa_id: session.userId }),
    findAnalistas(),
    findAllAplicativos(),
    findAllCatTipoTareas(),
    findRequirementsSummary(),
  ])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <RegistroDiarioManager
        initialRegistros={registros}
        analistas={analistas}
        aplicativos={aplicativos}
        tiposTarea={tiposTarea}
        requirements={requirements}
        currentUserId={session.userId}
        isSupervisor={isSupervisor}
      />
    </div>
  )
}
