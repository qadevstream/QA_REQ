export function generateRequirementCode(sequence: number): string {
  return `REQ-${String(sequence).padStart(4, '0')}`
}

export function isValidRequirementCode(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9\-]{2,19}$/.test(code)
}
