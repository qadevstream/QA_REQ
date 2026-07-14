// ─────────────────────────────────────────────────────────────────────────────
// Tema visual del Dashboard (SOLO presentación — no afecta lógica, datos ni cálculos).
// Usa la identidad de color ACTUAL del proyecto (familia azul corporativa),
// centralizada aquí para facilitar el mantenimiento del look SaaS Enterprise.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  ink:       '#0F172A', // slate/navy más oscuro (sidebar)
  navy:      '#003087', // azul corporativo profundo
  blue:      '#0184EF', // azul principal del proyecto
  blueSoft:  '#E8F4FE', // fondo suave para chips/iconos
  border:    '#E2E8F0',
  textMain:  '#0F172A',
  textMuted: '#64748B',
} as const

// Gradiente elegante del header (familia azul del proyecto, no verde)
export const HEADER_GRADIENT =
  'linear-gradient(90deg, #0F172A 0%, #003087 45%, #0184EF 100%)'

// Realce "glass" superpuesto al header
export const HEADER_GLASS =
  'radial-gradient(120% 120% at 100% 0%, rgba(255,255,255,0.18), transparent 55%)'

// Acento por KPI: un color distinto por indicador, dentro de la identidad actual.
// Son colores de ESTADO (info/éxito/riesgo/alerta), siempre acompañados de icono + label.
export const KPI_ACCENTS = {
  info:    { bar: '#0184EF', chip: '#E8F4FE', text: '#0369A1', icon: '#0184EF' },
  success: { bar: '#10B981', chip: '#ECFDF5', text: '#047857', icon: '#10B981' },
  danger:  { bar: '#EF4444', chip: '#FEF2F2', text: '#B91C1C', icon: '#EF4444' },
  warning: { bar: '#F59E0B', chip: '#FFFBEB', text: '#B45309', icon: '#F59E0B' },
} as const

export type KpiAccent = keyof typeof KPI_ACCENTS

// Relleno de las barras de ranking: un solo hue (magnitud), en azul del proyecto.
export const BAR_FILL = 'linear-gradient(90deg, #0184EF 0%, #003087 100%)'
