import type { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0184EF]/10">
          <Icon className="h-10 w-10 text-[#0184EF]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <span className="mt-5 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
          Próximamente
        </span>
      </div>
    </div>
  )
}
