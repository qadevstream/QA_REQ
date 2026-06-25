'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { ImportRequirementsDialog } from './ImportRequirementsDialog'

export function RequirementsImportButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Upload className="h-4 w-4" />Importar Excel
      </button>

      <ImportRequirementsDialog
        open={open}
        onOpenChange={setOpen}
        onImported={() => router.refresh()}
      />
    </>
  )
}
