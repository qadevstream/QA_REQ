import { LoginShowcase } from '@/components/login/LoginShowcase'
import { LoginForm } from '@/components/login/LoginForm'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden">
      {/* Panel izquierdo — Showcase (oculto en móvil/tablet) */}
      <section className="relative hidden w-full lg:flex lg:w-[55%]">
        <LoginShowcase />
      </section>

      {/* Panel derecho — Formulario */}
      <section className="relative flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:w-[45%]">
        {/* Glow ambiental detrás de la tarjeta */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/20 blur-[120px]"
        />
        <LoginForm error={error} />
      </section>
    </main>
  )
}
