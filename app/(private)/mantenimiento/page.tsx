import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAllAplicativos } from '@/server/repositories/aplicativosCatalogo.repository'
import { findAllCatTipoTareas } from '@/server/repositories/catTipoTarea.repository'
import { findAllFeriados } from '@/server/repositories/feriados.repository'
import { AplicativosCatalogoManager } from '@/components/mantenimiento/AplicativosCatalogoManager'
import { CatTipoTareaManager } from '@/components/mantenimiento/CatTipoTareaManager'
import { FeriadosManager } from '@/components/mantenimiento/FeriadosManager'

export const metadata: Metadata = { title: 'Mantenimiento' }

export default async function MantenimientoPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  if (session.profile.role === 'CLIENTE') redirect('/requirements')

  const [aplicativos, catTipoTareas, feriados] = await Promise.all([
    findAllAplicativos(false),
    findAllCatTipoTareas(false),
    findAllFeriados(false),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mantenimiento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de catálogos del sistema.
        </p>
      </div>
      <div className="space-y-6">
        <AplicativosCatalogoManager initialAplicativos={aplicativos} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CatTipoTareaManager initialItems={catTipoTareas} />
          <FeriadosManager initialItems={feriados} />
        </div>
      </div>
    </div>
  )
}
