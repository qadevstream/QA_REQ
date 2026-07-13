'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  ClipboardList, Clock, CalendarDays, BarChart2, FileBarChart,
  Users, History, LogOut, Settings2, TableProperties,
} from 'lucide-react'
import { signOutAction } from '@/server/actions/auth'
import type { Profile } from '@/types/domain.types'

type NavItem = {
  id: string
  label: string
  icon: React.ElementType
  href: string
  supervisorOnly?: boolean
  clienteOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'requerimientos', label: 'Requerimientos', icon: ClipboardList,   href: '/requirements' },
  { id: 'planner',        label: 'Planner',        icon: CalendarDays,    href: '/planner' },
  { id: 'actividades',    label: 'Actividades',    icon: Clock,           href: '/actividades' },
  { id: 'dashboard',      label: 'Dashboard',      icon: BarChart2,       href: '/dashboard' },
  { id: 'informes',       label: 'Informes',       icon: FileBarChart,    href: '/informes' },
  { id: 'reportes',       label: 'Reportes',       icon: TableProperties, href: '/reportes' },
  { id: 'analistas',      label: 'Analistas',      icon: Users,           href: '/analistas',     supervisorOnly: true },
  { id: 'auditoria',      label: 'Auditoría',      icon: History,         href: '/audit',         supervisorOnly: true },
  { id: 'mantenimiento',  label: 'Mantenimiento',  icon: Settings2,       href: '/mantenimiento' },
]

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR: 'Supervisor QA',
  ANALISTA_QA: 'Analista QA',
  CLIENTE: 'Cliente',
}

interface AppSidebarProps {
  profile: Profile
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const isSupervisor = profile.role === 'SUPERVISOR' || profile.role === 'ADMINISTRADOR'
  const isCliente = profile.role === 'CLIENTE'

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isCliente) return item.id === 'requerimientos'
    if (item.supervisorOnly) return isSupervisor
    return true
  })

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#0F172A] min-h-screen">
      <div className="flex items-center justify-center px-5 pt-6 pb-5 border-b border-white/10">
        <Image src="/logo_blanco.svg" alt="Logo" width={140} height={44}
          style={{ objectFit: 'contain', maxHeight: 44 }} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.id} href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors
                ${isActive ? 'bg-[#0184EF]/20 border border-[#0184EF]/30' : 'border border-transparent hover:bg-white/5'}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-md ${isActive ? 'bg-[#0184EF]' : 'bg-white/10'}`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className={`text-sm ${isActive ? 'font-semibold text-white' : 'font-medium text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0184EF]/20 text-[#0184EF] text-xs font-bold">
            {profile.full_name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role] ?? profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
        <p className="mt-3 text-xs text-slate-600">QA Control Center · v1.0</p>
      </div>
    </aside>
  )
}
