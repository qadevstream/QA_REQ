import type { Profile, UserRole } from '@/types/domain.types'

export function isSupervisor(profile: Profile | null): boolean {
  return profile?.role === 'SUPERVISOR' || profile?.role === 'ADMINISTRADOR'
}

export function isAnalistaQA(profile: Profile | null): boolean {
  return profile?.role === 'ANALISTA_QA'
}

export function hasRole(profile: Profile | null, role: UserRole): boolean {
  return profile?.role === role
}
