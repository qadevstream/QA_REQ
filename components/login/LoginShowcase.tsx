'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  FileText,
  ClipboardCheck,
  PlayCircle,
  Bug,
  KanbanSquare,
  BarChart3,
  FileBarChart,
  Sparkles,
  ShieldCheck,
  Cloud,
  Users,
  Zap,
} from 'lucide-react'
import { DashboardPreview } from './DashboardPreview'

const FEATURES = [
  { icon: FileText, title: 'Requerimientos', desc: 'Gestión completa', color: '#2563EB' },
  { icon: ClipboardCheck, title: 'Casos de Prueba', desc: 'Diseña y ejecuta', color: '#22C55E' },
  { icon: PlayCircle, title: 'Ejecución QA', desc: 'Corridas y evidencia', color: '#60A5FA' },
  { icon: Bug, title: 'Defectos', desc: 'Reporta y da seguimiento', color: '#8B5CF6' },
  { icon: KanbanSquare, title: 'Planner Kanban', desc: 'Tablero inteligente', color: '#FACC15' },
  { icon: BarChart3, title: 'Dashboard BI', desc: 'Métricas en tiempo real', color: '#06B6D4' },
  { icon: FileBarChart, title: 'Reportes', desc: 'Exporta e informa', color: '#F472B6' },
  { icon: Sparkles, title: 'IA Integrada', desc: 'Casos de prueba con IA', color: '#A78BFA' },
]

const BENEFITS = [
  { icon: ShieldCheck, title: 'Seguro y confiable', desc: 'Tus datos protegidos' },
  { icon: Cloud, title: 'Acceso 24/7', desc: 'Siempre disponible' },
  { icon: Users, title: 'Colaborativo', desc: 'Trabajo en equipo' },
  { icon: Zap, title: 'Alto rendimiento', desc: 'Rápido y eficiente' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export function LoginShowcase() {
  return (
    <div className="relative flex w-full flex-col justify-center overflow-hidden bg-[#0A1322] px-10 py-12 xl:px-16">
      <DecorativeBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-2xl"
      >
        {/* Logo */}
        <motion.div variants={item} className="mb-8">
          <Image
            src="/logo_blanco.svg"
            alt="DevStream"
            width={170}
            height={48}
            priority
            style={{ objectFit: 'contain', height: 'auto', maxHeight: 44 }}
          />
        </motion.div>

        {/* Título */}
        <motion.h1
          variants={item}
          className="text-[40px] font-bold leading-[1.05] tracking-tight xl:text-[48px]"
        >
          <span className="text-[#3B82F6]">QA</span> <span className="text-white">Control Center</span>
        </motion.h1>
        <motion.p variants={item} className="mt-2 text-[18px] font-medium text-[#A7B3C7]">
          Enterprise Quality Management Platform
        </motion.p>
        <motion.p variants={item} className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#8A98AE]">
          Centraliza requerimientos, casos de prueba, defectos, planificación y métricas en una sola
          plataforma inteligente.
        </motion.p>

        {/* Feature grid */}
        <motion.div
          variants={item}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group rounded-2xl border border-white/[0.08] bg-[#121C2F]/70 p-3.5 transition-colors hover:border-[#2563EB]/40 hover:shadow-[0_0_24px_-4px_rgba(96,165,250,0.35)]"
              >
                <div
                  className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${f.color}1F` }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: f.color }} />
                </div>
                <p className="text-[13px] font-semibold text-white">{f.title}</p>
                <p className="text-[11px] text-[#8A98AE]">{f.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Dashboard preview */}
        <motion.div variants={item} className="mt-8">
          <DashboardPreview />
        </motion.div>

        {/* Beneficios */}
        <motion.div variants={item} className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon
            return (
              <div key={b.title} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#121C2F]">
                  <Icon className="h-4 w-4 text-[#60A5FA]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-white">{b.title}</p>
                  <p className="truncate text-[10px] text-[#8A98AE]">{b.desc}</p>
                </div>
              </div>
            )
          })}
        </motion.div>
      </motion.div>
    </div>
  )
}

function DecorativeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Glows */}
      <div className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-[#2563EB]/15 blur-[130px]" />
      <div className="absolute -bottom-24 right-0 h-[360px] w-[360px] rounded-full bg-[#60A5FA]/10 blur-[130px]" />
      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 30% 20%, black, transparent)',
        }}
      />
      {/* Ondas */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-30"
        viewBox="0 0 1200 200"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 120 Q 300 60 600 120 T 1200 120"
          stroke="#2563EB"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <path d="M0 150 Q 300 90 600 150 T 1200 150" stroke="#60A5FA" strokeWidth="1.5" opacity="0.25" />
      </svg>
      {/* Partículas */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#60A5FA]"
          style={{ left: p.left, top: p.top }}
          animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.6, 1] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

const PARTICLES = [
  { left: '12%', top: '18%', dur: 4, delay: 0 },
  { left: '78%', top: '12%', dur: 5, delay: 0.6 },
  { left: '64%', top: '30%', dur: 3.5, delay: 1.1 },
  { left: '28%', top: '62%', dur: 4.5, delay: 0.3 },
  { left: '88%', top: '55%', dur: 5.5, delay: 0.9 },
  { left: '45%', top: '80%', dur: 4, delay: 1.4 },
]
