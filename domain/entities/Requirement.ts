import type { Requirement } from '@/types/domain.types'

export function enrichRequirement(req: Requirement): Requirement {
  return { ...req }
}

export function canAnalistaUpdate(req: Requirement, userId: string): boolean {
  return (
    req.responsable_qa_id === userId ||
    req.qa_apoyo_1_id === userId ||
    req.qa_apoyo_2_id === userId ||
    req.qa_apoyo_3_id === userId
  )
}
