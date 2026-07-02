import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/actions/auth'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { IdleLogout } from '@/components/layout/IdleLogout'

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <IdleLogout />
      <AppSidebar profile={session.profile} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
