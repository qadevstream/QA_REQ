export interface BloqueoInput {
  bloqueado: boolean
  motivo_bloqueo?: string | null
}

export function validateBloqueo(input: BloqueoInput): string | null {
  if (input.bloqueado && (!input.motivo_bloqueo || input.motivo_bloqueo.trim() === '')) {
    return 'El motivo de bloqueo es obligatorio cuando la iteración está bloqueada.'
  }
  return null
}
