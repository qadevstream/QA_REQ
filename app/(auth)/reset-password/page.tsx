'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState('')

  // El cliente de Supabase detecta automáticamente la sesión de recuperación
  // desde la URL (code PKCE o token en el hash). Esperamos a que se establezca.
  useEffect(() => {
    const supabase = createClient()
    let settled = false

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      setReady(ok ? 'ok' : 'invalid')
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true)
    })

    // Verificación inicial por si la sesión ya estaba lista
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(true)
    })

    // Si tras unos segundos no hay sesión, el enlace es inválido/expirado
    const timer = setTimeout(() => finish(false), 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setStatus('loading')
    const supabase = createClient()
    const { error: updErr } = await supabase.auth.updateUser({ password })

    if (updErr) {
      setStatus('idle')
      setError(updErr.message)
      return
    }
    // Contraseña actualizada — ya hay sesión válida, ir al dashboard
    router.replace('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB]/15 blur-[120px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo_blanco.svg"
            alt="DevStream"
            width={150}
            height={44}
            priority
            style={{ objectFit: 'contain', height: 'auto', maxHeight: 40 }}
          />
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-[#121C2F]/85 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-9">
          {ready === 'invalid' ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EF4444]/15 ring-1 ring-[#EF4444]/30">
                <AlertCircle className="h-8 w-8 text-[#EF4444]" />
              </div>
              <h2 className="text-[22px] font-semibold text-white">Enlace inválido o expirado</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#A7B3C7]">
                El enlace de restablecimiento ya no es válido. Solicita uno nuevo para continuar.
              </p>
              <Link
                href="/forgot-password"
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[14px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.8)]"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-[#2563EB] opacity-60 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-[0_8px_30px_-6px_rgba(37,99,235,0.8)] ring-1 ring-white/20">
                    <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <h2 className="text-[22px] font-semibold text-white">Nueva contraseña</h2>
                <p className="mt-1 text-[14px] text-[#A7B3C7]">
                  Define una contraseña segura para tu cuenta.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-2.5 text-[13px] text-[#FCA5A5]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordField
                  id="password"
                  label="Nueva contraseña"
                  value={password}
                  onChange={setPassword}
                  show={show}
                  onToggle={() => setShow((v) => !v)}
                />
                <PasswordField
                  id="confirm"
                  label="Confirmar contraseña"
                  value={confirm}
                  onChange={setConfirm}
                  show={show}
                  onToggle={() => setShow((v) => !v)}
                />

                <motion.button
                  type="submit"
                  disabled={status === 'loading' || ready !== 'ok'}
                  whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                  whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.8)] transition-shadow hover:shadow-[0_14px_40px_-8px_rgba(59,130,246,0.9)] disabled:opacity-60"
                >
                  {status === 'loading' ? 'Guardando…' : 'Guardar contraseña'}
                  {status !== 'loading' && (
                    <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-[#5A6678]">
          © 2026 DevStream · Todos los derechos reservados.
        </p>
      </motion.div>
    </main>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[13px] font-medium text-[#A7B3C7]">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors group-focus-within:text-[#60A5FA]">
          <Lock className="h-[18px] w-[18px]" />
        </span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••••"
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0E1728] pl-11 pr-11 text-[14px] text-white placeholder:text-[#4F5D72] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors hover:text-white"
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  )
}
