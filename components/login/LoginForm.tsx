'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'

export function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-[420px]"
    >
      {/* Logo + tagline solo en móvil (el showcase se oculta) */}
      <div className="mb-8 flex flex-col items-center text-center lg:hidden">
        <Image
          src="/logo_blanco.svg"
          alt="DevStream"
          width={150}
          height={44}
          priority
          style={{ objectFit: 'contain', height: 'auto', maxHeight: 40 }}
        />
        <p className="mt-3 text-sm text-[#A7B3C7]">
          Enterprise Quality Management Platform
        </p>
      </div>

      {/* Tarjeta glassmorphism */}
      <div className="rounded-[24px] border border-white/[0.08] bg-[#121C2F]/85 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:p-9">
        {/* Escudo con glow */}
        <div className="mb-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
            className="relative mb-5"
          >
            <div className="absolute inset-0 rounded-2xl bg-[#2563EB] blur-xl opacity-60" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-[0_8px_30px_-6px_rgba(37,99,235,0.8)] ring-1 ring-white/20">
              <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2.2} />
            </div>
          </motion.div>
          <h2 className="text-[22px] font-semibold text-white">Bienvenido de nuevo</h2>
          <p className="mt-1 text-[14px] text-[#A7B3C7]">Inicia sesión para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3.5 py-2.5 text-[13px] text-[#FCA5A5]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{decodeURIComponent(error)}</span>
          </motion.div>
        )}

        {/* Formulario */}
        <form action="/api/auth/login" method="POST" className="space-y-5">
          <Field
            id="email"
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="usuario@empresa.com"
            autoComplete="email"
            icon={<Mail className="h-[18px] w-[18px]" />}
          />

          <div className="space-y-2">
            <label htmlFor="password" className="text-[13px] font-medium text-[#A7B3C7]">
              Contraseña
            </label>
            <div className="group relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors group-focus-within:text-[#60A5FA]">
                <Lock className="h-[18px] w-[18px]" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0E1728] pl-11 pr-11 text-[14px] text-white placeholder:text-[#4F5D72] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {/* Recordarme / Olvidaste */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-[#A7B3C7]">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-white/20 bg-[#0E1728] accent-[#2563EB]"
                defaultChecked
              />
              Recordarme
            </label>
            <Link href="/forgot-password" className="text-[13px] font-medium text-[#60A5FA] transition-colors hover:text-[#93C5FD]">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Botón principal */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(37,99,235,0.8)] transition-shadow hover:shadow-[0_14px_40px_-8px_rgba(59,130,246,0.9)]"
          >
            Ingresar al Sistema
            <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </form>

        {/* Pie de la tarjeta */}
        <div className="mt-7 flex items-center justify-center border-t border-white/[0.06] pt-4">
          <p className="text-[11px] text-[#6B7A93]">Versión v1.0.0</p>
        </div>
      </div>

      {/* Footer general */}
      <p className="mt-6 text-center text-[12px] text-[#5A6678]">
        © 2026 DevStream · Todos los derechos reservados.
      </p>
    </motion.div>
  )
}

function Field({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  icon,
}: {
  id: string
  name: string
  type: string
  label: string
  placeholder: string
  autoComplete: string
  icon: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[13px] font-medium text-[#A7B3C7]">
        {label}
      </label>
      <div className="group relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7A93] transition-colors group-focus-within:text-[#60A5FA]">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0E1728] pl-11 pr-4 text-[14px] text-white placeholder:text-[#4F5D72] outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30"
        />
      </div>
    </div>
  )
}

