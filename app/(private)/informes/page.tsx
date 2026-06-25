import type { Metadata } from 'next'
import { FileBarChart } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export const metadata: Metadata = { title: 'Informes' }

export default function InformesPage() {
  return (
    <ComingSoon
      icon={FileBarChart}
      title="Informes"
      description="Reportes exportables de avance, defectos y cumplimiento del área QA."
    />
  )
}
