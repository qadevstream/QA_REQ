'use client'

import { useState, useCallback } from 'react'
import { getRequirementsAction } from '@/server/actions/requirements'
import type { Requirement, RequirementFilters } from '@/types/domain.types'

export function useRequirements(initialData: Requirement[] = []) {
  const [requirements, setRequirements] = useState<Requirement[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (filters: RequirementFilters = {}) => {
    setLoading(true)
    setError(null)
    const result = await getRequirementsAction(filters)
    if (result.success) {
      setRequirements(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  const updateItem = useCallback((updated: Requirement) => {
    setRequirements((prev) =>
      prev.map((req) => (req.id === updated.id ? updated : req))
    )
  }, [])

  return { requirements, loading, error, refresh, updateItem }
}
