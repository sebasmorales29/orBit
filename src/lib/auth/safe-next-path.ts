/** Rutas internas permitidas tras auth (evita open redirects). */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next) return null
  const trimmed = next.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  return trimmed
}

/** Destino post-auth según `next` explícito o tipo de flujo Supabase. */
export function resolveAuthNextPath(
  nextParam: string | null,
  type: string | null
): string {
  const safe = sanitizeNextPath(nextParam)
  if (safe) return safe

  if (type === 'recovery') return '/reset-password'
  if (type === 'signup' || type === 'email' || type === 'invite') return '/onboarding'
  return '/onboarding'
}
