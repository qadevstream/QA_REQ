'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }
    setStatus('sent')
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
          {status === 'sent' ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#22C55E]/15 ring-1 ring-[#22C55E]/30">
                <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
              </div>
              <h2 className="text-[22px] font-semibold text-white">Revisa tu correo</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#A7B3C7]">
                Si <span className="font-medium text-white">{email}</span> está registrado, te
                enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
              </p>
              <Link
                href="/login"
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0E1728] text-[14px] font-medium text-white transition-colors hover:bg-[#142036]"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
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
                <h2 className="text-[22px] font-semibold text-white">¿Olvidaste tu contraseña?</h2>
                <p className="mt-1 text-[14px] text-[#A7B3C7]">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              {status === 'error' && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-2.5 text-[13px] text-[#FCA5A5]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[13px] font-medium text-[#A7B3C7]">
                    Correo electrónico
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors group-focus-within:text-[#60A5FA]">
                      <Mail className="h-[18px] w-[18px]" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0E1728] pl-11 pr-4 text-[14px] text-white placeholder:text-[#4F5D72] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                  whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.8)] transition-shadow hover:shadow-[0_14px_40px_-8px_rgba(59,130,246,0.9)] disabled:opacity-60"
                >
                  {status === 'loading' ? 'Enviando…' : 'Enviar enlace'}
                  {status !== 'loading' && (
                    <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
                  )}
                </motion.button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-[13px] font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD]"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
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
