import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RequirementFilters } from '@/components/requirements/RequirementFilters'
import { RequirementTable } from '@/components/requirements/RequirementTable'
import { RequirementsImportButton } from '@/components/requirements/RequirementsImportButton'
import { findAllRequirements, findUsedAplicativoCodigos } from '@/server/repositories/requirements.repository'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { getCurrentUser } from '@/server/actions/auth'
import { redirect } from 'next/navigation'
import type { RequirementFilters as Filters } from '@/types/domain.types'
import type { EstadoQaEnum } from '@/types/database.types'

export const metadata: Metadata = { title: 'Requerimientos' }

interface PageProps {
  searchParams: Promise<{
    search?: string
    estado_qa?: string
    aplicativo?: string
    responsable_qa_id?: string
    open?: string
  }>
}

export default async function RequirementsPage({ searchParams }: PageProps) {
  const session = await getCurrentUser()
  if (!session) redirect('/login')

  const params = await searchParams

  const filters: Filters = {
    search: params.search,
    estado_qa: params.estado_qa as EstadoQaEnum | 'ALL' | undefined,
    aplicativo: params.aplicativo as string | 'ALL' | undefined,
    responsable_qa_id: params.responsable_qa_id,
  }

  const isSupervisor = session.profile.role === 'SUPERVISOR' || session.profile.role === 'ADMINISTRADOR'
  const isCliente = session.profile.role === 'CLIENTE'

  const [requirements, analistas, aplicativosCatalogo, usedAplicativos] = await Promise.all([
    findAllRequirements(filters),
    findAnalistas(),
    findAllAplicativos(),
    findUsedAplicativoCodigos(),
  ])

  // Catálogo completo ordenado alfabéticamente (para editar en la tabla)
  const aplicativos = [...aplicativosCatalogo].sort((a, b) =>
    a.codigo.localeCompare(b.codigo, 'es', { sensitivity: 'base' })
  )

  // Para el FILTRO: solo los aplicativos que aparecen en requerimientos registrados
  const usedSet = new Set(usedAplicativos)
  const aplicativosEnUso = aplicativos.filter((a) => usedSet.has(a.codigo))

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6 gap-4">
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requerimientos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {requirements.length} requerimiento{requirements.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isCliente && (
          <div className="flex items-center gap-2">
            {isSupervisor && <RequirementsImportButton />}
            <Button asChild>
              <Link href="/requirements/new">
                <Plus className="h-4 w-4" />
                Nuevo
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="shrink-0">
        <RequirementFilters analistas={analistas} aplicativos={aplicativosEnUso} />
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden">
        <RequirementTable
          requirements={requirements}
          aplicativos={aplicativos}
          analistas={analistas}
          canEdit={!isCliente}
          openId={params.open}
        />
      </Card>
    </div>
  )
}
