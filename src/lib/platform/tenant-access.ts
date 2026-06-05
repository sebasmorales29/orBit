import { createAdminClient } from '@/lib/supabase/admin'
import { emailMatchesAllowedDomains } from '@/lib/platform/tenant-slug'

export async function countTenantSeats(organizationId: string): Promise<number> {
  const admin = createAdminClient()
  if (!admin) return 0

  const { count: members } = await admin
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  const now = new Date().toISOString()
  const { count: pending } = await admin
    .from('organization_invites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .gt('expires_at', now)

  return (members ?? 0) + (pending ?? 0)
}

export async function getTenantAccessPolicy(organizationId: string): Promise<{
  maxMembers: number | null
  allowedDomains: string[]
} | null> {
  const admin = createAdminClient()
  if (!admin) return null

  const { data } = await admin
    .from('organizations')
    .select('max_members, allowed_email_domains')
    .eq('id', organizationId)
    .maybeSingle()

  if (!data) return null

  const domains = Array.isArray(data.allowed_email_domains)
    ? (data.allowed_email_domains as string[]).map((d) => d.toLowerCase())
    : []

  return {
    maxMembers: data.max_members ?? null,
    allowedDomains: domains,
  }
}

export async function assertCanAddTenantMember(input: {
  organizationId: string
  email: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const policy = await getTenantAccessPolicy(input.organizationId)
  if (!policy) {
    return { ok: false, message: 'Tenant no encontrado.' }
  }

  const email = input.email.trim().toLowerCase()
  if (!emailMatchesAllowedDomains(email, policy.allowedDomains)) {
    const hint =
      policy.allowedDomains.length === 1
        ? `@${policy.allowedDomains[0]}`
        : policy.allowedDomains.map((d) => `@${d}`).join(', ')
    return {
      ok: false,
      message: `Este tenant solo acepta correos con dominio: ${hint}.`,
    }
  }

  if (policy.maxMembers != null) {
    const seats = await countTenantSeats(input.organizationId)
    if (seats >= policy.maxMembers) {
      return {
        ok: false,
        message: `Límite de usuarios alcanzado (${policy.maxMembers}). Aumentá el cupo en Ops o revocá invitaciones pendientes.`,
      }
    }
  }

  return { ok: true }
}

export async function resolvePublishedTenantBySlug(slug: string) {
  const admin = createAdminClient()
  if (!admin) return null

  const normalized = slug.trim().toLowerCase()
  const { data } = await admin
    .from('organizations')
    .select('id, name, slug, public_url_published, platform_status, is_demo')
    .eq('slug', normalized)
    .eq('public_url_published', true)
    .maybeSingle()

  if (!data || data.platform_status === 'suspended') return null
  return data
}
