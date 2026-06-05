/** Host dedicado para la consola /ops (ej. ops.orbit-one-mu.vercel.app). */
export function getOpsHost(): string | null {
  const raw = process.env.ORBIT_OPS_HOST?.trim()
  if (!raw) return null
  return raw
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

export function getPublicAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) return null
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return u.origin
  } catch {
    return null
  }
}

export function getPublicAppHost(): string | null {
  const origin = getPublicAppUrl()
  if (!origin) return null
  try {
    return new URL(origin).host.toLowerCase()
  } catch {
    return null
  }
}

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '').split(':')[0].toLowerCase()
}

/** true cuando ORBIT_OPS_HOST y NEXT_PUBLIC_APP_URL apuntan a hosts distintos. */
export function hostSplitEnabled(): boolean {
  const ops = getOpsHost()
  const pub = getPublicAppHost()
  return Boolean(ops && pub && ops !== pub)
}

export function isOpsHost(host: string | null | undefined): boolean {
  const ops = getOpsHost()
  if (!ops) return false
  return normalizeHost(host) === ops
}

export function isPublicAppHost(host: string | null | undefined): boolean {
  if (!hostSplitEnabled()) return true
  return normalizeHost(host) === getPublicAppHost()
}

export function opsOrigin(proto = 'https'): string {
  const host = getOpsHost()
  if (!host) return ''
  return `${proto}://${host}`
}

/** URL absoluta de la consola (para enlaces desde el sitio público). */
export function getOpsAbsoluteHref(): string {
  if (!hostSplitEnabled()) return '/ops'
  return `${opsOrigin()}/ops`
}

/** URL absoluta del sitio público (para enlaces desde /ops). */
export function getPublicSiteAbsoluteHref(): string {
  if (!hostSplitEnabled()) return '/'
  return getPublicAppUrl() ?? '/'
}

/** URL de entrada secreta del super admin. */
export function getOpsEntryHref(token: string): string {
  const path = `/ops/entry/${token}`
  if (!hostSplitEnabled()) return path
  return `${opsOrigin()}${path}`
}
