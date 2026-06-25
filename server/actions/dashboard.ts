'use server'

import { getDashboardMetrics } from '@/server/usecases/getDashboardMetrics'
import { findAnalistas } from '@/server/repositories/profiles.repository'
import type { ActionResult, DashboardMetrics, Profile } from '@/types/domain.types'

export async function getDashboardMetricsAction(): Promise<ActionResult<DashboardMetrics>> {
  try {
    const data = await getDashboardMetrics()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function getAnalistasAction(): Promise<ActionResult<Profile[]>> {
  try {
    const data = await findAnalistas()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
