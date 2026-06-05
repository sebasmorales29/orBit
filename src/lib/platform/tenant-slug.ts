const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyTenantName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function isValidTenantSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 48 && SLUG_RE.test(slug)
}

export function parseAllowedDomains(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter((d) => d.includes('.') && !d.includes('@'))
}

export function emailMatchesAllowedDomains(email: string, domains: string[]): boolean {
  if (!domains.length) return true
  const domain = email.trim().toLowerCase().split('@')[1]
  if (!domain) return false
  return domains.some((d) => domain === d || domain.endsWith(`.${d}`))
}

export function tenantPublicPath(slug: string): string {
  return `/t/${slug}`
}

import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>

export async function ensureUniqueTenantSlug(
  admin: AdminClient,
  baseSlug: string,
  excludeOrgId?: string
): Promise<string> {
  let candidate = baseSlug || 'tenant'
  let n = 0
  while (n < 50) {
    const slug = n === 0 ? candidate : `${candidate}-${n + 1}`
    const { data } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data || (excludeOrgId && data.id === excludeOrgId)) return slug
    n += 1
  }
  return `${candidate}-${Date.now().toString(36).slice(-4)}`
}

export function tenantPublicUrl(slug: string, appUrl?: string): string {
  const base = (appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  return `${base}${tenantPublicPath(slug)}`
}
