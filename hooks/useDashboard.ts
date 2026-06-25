'use client'

import { useState, useCallback } from 'react'
import { getDashboardMetricsAction } from '@/server/actions/dashboard'
import type { DashboardMetrics } from '@/types/domain.types'

export function useDashboard(initialMetrics?: DashboardMetrics) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getDashboardMetricsAction()
    if (result.success) {
      setMetrics(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  return { metrics, loading, error, refresh }
}
