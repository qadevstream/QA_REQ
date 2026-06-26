'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const form = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Credenciales incorrectas. Verifica tu email y contraseña.'
          : authError.message
      )
      setIsPending(false)
      return
    }

    // createBrowserClient almacena la sesión en cookies que el middleware puede leer.
    // window.location.href hace hard-navigation para que el browser envíe esas cookies.
    window.location.href = '/dashboard'
  }

  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">QA Control Center</h1>
        <p className="mt-1 text-sm text-slate-400">Sistema de Seguimiento QA</p>
      </div>

      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-center text-lg">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Ingresa tus credenciales para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@empresa.com"
                required
                autoComplete="email"
                className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-primary"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-900/40 border border-red-700/50 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-600">
        v1.0 · Área de Calidad de Software
      </p>
    </div>
  )
}
