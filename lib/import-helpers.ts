// Helpers compartidos para los importadores de Excel/CSV
// (Actividades → registro_diario, Requerimientos → requirements).

export function resolveEnumValue(
  value: string | undefined,
  labels: Record<string, string>
): string | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()

  // Coincidencia exacta primero (clave o etiqueta)
  const exact = Object.entries(labels).find(
    ([key, label]) => key.toLowerCase() === v || label.toLowerCase() === v
  )
  if (exact) return exact[0]

  // Coincidencia parcial — tolera prefijos/sufijos como "[NO SAP] Fondo Crecer"
  const partial = Object.entries(labels).find(
    ([key, label]) => v.includes(label.toLowerCase()) || v.includes(key.toLowerCase())
  )
  return partial?.[0]
}

export function parseFecha(value: string | undefined): string | undefined {
  if (!value) return undefined
  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(value)
  if (isoMatch) return value.slice(0, 10)
  const dmy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return undefined
}

// Resuelve el nombre de un analista (texto libre, ej. "Juan Torres") al
// id de su perfil, por coincidencia exacta o parcial de nombre.
export function resolvePersonId(
  value: string | undefined,
  personas: { id: string; full_name: string }[]
): string | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (!v) return undefined

  const exact = personas.find((p) => p.full_name.trim().toLowerCase() === v)
  if (exact) return exact.id

  const partial = personas.find(
    (p) => v.includes(p.full_name.toLowerCase()) || p.full_name.toLowerCase().includes(v)
  )
  return partial?.id
}
