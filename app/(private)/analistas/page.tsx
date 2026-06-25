import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { findAnalistasConCorreo } from '@/server/actions/analistas'
import { AnalistasManager } from '@/components/analistas/AnalistasManager'

export const metadata: Metadata = { title: 'Analistas QA' }

export default async function AnalistasPage() {
  const session = await getCurrentUser()
  if (!session) redirect('/login')
  if (session.profile.role !== 'SUPERVISOR' && session.profile.role !== 'ADMINISTRADOR') redirect('/requirements')

  const analistas = await findAnalistasConCorreo()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AnalistasManager initialAnalistas={analistas} />
    </div>
  )
}
