import { assertPlatformAdmin } from '@/lib/platform/admin'
import { ensureUniqueTenantSlug, isValidTenantSlug } from '@/lib/platform/tenant-slug'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CurrencyCode } from '@/types/database'
import { getSuperAdminEmail, isSuperAdminEmail } from '@/lib/platform/admin'
import {
  canAssignOwnerRole,
  normalizeRoleForDb,
  ownerRoleBlockedMessage,
} from '@/lib/platform/owner-policy'

export type PlatformStatus = 'trial' | 'active' | 'suspended'
export type PlanTier = 'trial' | 'starter' | 'pro' | 'enterprise'

export interface TenantDetail {
  id: string
  name: string
  business_type: string | null
  currency: CurrencyCode
  uses_stock: boolean
  onboarding_completed: boolean
  created_at: string
  platform_status: PlatformStatus
  plan_tier: PlanTier
  monthly_fee_cents: number
  platform_notes: string | null
  slug: string | null
  max_members: number | null
  allowed_email_domains: string[]
  is_demo: boolean
  public_url_published: boolean
  packId: string | null
  ownerEmail: string | null
  ownerName: string | null
  members: { user_id: string; role: string; email: string | null }[]
  invites: { id: string; email: string; role: string; status: 'Pendiente' }[]
  ordersCount: number
  ordersTotal: number
  seatCount: number
}

export type TenantAdminResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED' | 'SCHEMA' | 'NOT_FOUND' | 'FAILED'
      message: string
      sqlFix?: string
    }

function parseProfile(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return { packId: null, ownerEmail: null, ownerName: null }
  }
  const p = raw as Record<string, unknown>
  return {
    packId: typeof p.packId === 'string' ? p.packId : null,
    ownerEmail: typeof p.provisionedOwnerEmail === 'string' ? p.provisionedOwnerEmail : null,
    ownerName: typeof p.preferredName === 'string' ? p.preferredName : null,
  }
}

async function ensureAdminClient(): Promise<
  | { ok: true; admin: NonNullable<ReturnType<typeof createAdminClient>> }
  | { ok: false; code: 'ADMIN_NOT_CONFIGURED' | 'SCHEMA'; message: string; sqlFix?: string }
> {
  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false as const,
      code: 'ADMIN_NOT_CONFIGURED' as const,
      message: 'Falta SUPABASE_SERVICE_ROLE_KEY.',
    }
  }
  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return {
      ok: false as const,
      code: 'SCHEMA' as const,
      message: `Migración pendiente: ${schema.missingColumns.join(', ')}`,
      sqlFix: schema.sqlFix,
    }
  }
  return { ok: true as const, admin }
}

async function ensureAdmin() {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    return { ok: false as const, code: 'NOT_AUTHORIZED' as const, message: 'Sin permiso.' }
  }
  return ensureAdminClient()
}

/** Datos de tenant — solo usar desde páginas bajo (console)/layout (ya autenticado). */
export async function queryTenantDetail(orgId: string): Promise<TenantAdminResult<TenantDetail>> {
  const ctx = await ensureAdminClient()
  if (!ctx.ok) return ctx

  const { data: org, error } = await ctx.admin
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle()

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  if (!org) return { ok: false, code: 'NOT_FOUND', message: 'Tenant no encontrado.' }

  const meta = parseProfile(org.onboarding_profile)

  const { data: members } = await ctx.admin
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', orgId)

  const memberRows: TenantDetail['members'] = []
  for (const m of members ?? []) {
    const { data: userData } = await ctx.admin.auth.admin.getUserById(m.user_id)
    memberRows.push({
      user_id: m.user_id,
      role: m.role,
      email: userData.user?.email ?? null,
    })
  }

  const { data: invites } = await ctx.admin
    .from('organization_invites')
    .select('id, email, role, status, expires_at')
    .eq('organization_id', orgId)

  const now = Date.now()
  const inviteRows: TenantDetail['invites'] = (invites ?? [])
    .filter((i) => i.status === 'pending' && new Date(i.expires_at).getTime() > now)
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: 'Pendiente',
    }))

  const { data: orders } = await ctx.admin
    .from('orders')
    .select('total')
    .eq('organization_id', orgId)

  const ordersTotal = (orders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0)

  const seatCount = memberRows.length + inviteRows.length
  const domains = Array.isArray(org.allowed_email_domains)
    ? (org.allowed_email_domains as string[])
    : []

  return {
    ok: true,
    data: {
      id: org.id,
      name: org.name,
      business_type: org.business_type,
      currency: org.currency as CurrencyCode,
      uses_stock: org.uses_stock,
      onboarding_completed: org.onboarding_completed,
      created_at: org.created_at,
      platform_status: (org.platform_status ?? 'active') as PlatformStatus,
      plan_tier: (org.plan_tier ?? 'trial') as PlanTier,
      monthly_fee_cents: org.monthly_fee_cents ?? 0,
      platform_notes: org.platform_notes ?? null,
      slug: org.slug ?? null,
      max_members: org.max_members ?? null,
      allowed_email_domains: domains,
      is_demo: Boolean(org.is_demo),
      public_url_published: Boolean(org.public_url_published),
      packId: meta.packId,
      ownerEmail: meta.ownerEmail,
      ownerName: meta.ownerName,
      members: memberRows,
      invites: inviteRows,
      ordersCount: orders?.length ?? 0,
      ordersTotal,
      seatCount,
    },
  }
}

export async function getTenantDetail(orgId: string): Promise<TenantAdminResult<TenantDetail>> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    return { ok: false, code: 'NOT_AUTHORIZED', message: 'Sin permiso.' }
  }
  return queryTenantDetail(orgId)
}

export interface UpdateTenantInput {
  name?: string
  platform_status?: PlatformStatus
  plan_tier?: PlanTier
  monthly_fee_cents?: number
  platform_notes?: string | null
  uses_stock?: boolean
  currency?: CurrencyCode
  slug?: string | null
  max_members?: number | null
  allowed_email_domains?: string[]
  is_demo?: boolean
  public_url_published?: boolean
  business_type?: string | null
}

export async function updateTenant(
  orgId: string,
  input: UpdateTenantInput
): Promise<TenantAdminResult<{ id: string }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  const patch: Record<string, unknown> = { ...input }

  if (input.slug !== undefined) {
    const raw = input.slug?.trim().toLowerCase() ?? ''
    if (!raw) {
      patch.slug = null
      patch.public_url_published = false
    } else if (!isValidTenantSlug(raw)) {
      return {
        ok: false,
        code: 'FAILED',
        message: 'Slug inválido: solo minúsculas, números y guiones (2–48 caracteres).',
      }
    } else {
      const unique = await ensureUniqueTenantSlug(ctx.admin, raw, orgId)
      patch.slug = unique
    }
  }

  if (input.public_url_published && !patch.slug && input.slug === undefined) {
    const { data: current } = await ctx.admin
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .maybeSingle()
    if (!current?.slug) {
      return {
        ok: false,
        code: 'FAILED',
        message: 'Definí un slug antes de publicar la URL del tenant.',
      }
    }
  }

  const { error } = await ctx.admin.from('organizations').update(patch).eq('id', orgId)
  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { id: orgId } }
}

export async function deleteTenant(orgId: string): Promise<TenantAdminResult<{ id: string }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  // Antes de borrar el tenant, desactiva (ban) todos sus usuarios.
  const { data: members, error: membersErr } = await ctx.admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)

  if (membersErr) return { ok: false, code: 'FAILED', message: membersErr.message }

  const superEmail = getSuperAdminEmail()

  for (const m of members ?? []) {
    const userId = (m as { user_id: string }).user_id
    // Evita bloquear accidentalmente al super admin si estuviera en el tenant.
    if (superEmail) {
      const { data: u } = await ctx.admin.auth.admin.getUserById(userId)
      const email = u.user?.email ?? null
      if (isSuperAdminEmail(email)) continue
    }
    const { error: banErr } = await ctx.admin.auth.admin.updateUserById(userId, {
      ban_duration: '87600h', // ~10 años
    })
    if (banErr) return { ok: false, code: 'FAILED', message: banErr.message }
  }

  const { error } = await ctx.admin.from('organizations').delete().eq('id', orgId)
  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { id: orgId } }
}

export async function setTenantMemberRole(input: {
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'visitor'
}): Promise<TenantAdminResult<{ ok: true }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  const superEmail = getSuperAdminEmail()
  if (superEmail) {
    const { data: u } = await ctx.admin.auth.admin.getUserById(input.userId)
    const email = u.user?.email ?? null
    if (isSuperAdminEmail(email)) {
      return { ok: false, code: 'FAILED', message: 'No se puede cambiar el rol del super admin.' }
    }
  }

  const dbRole = normalizeRoleForDb(input.role)

  if (dbRole === 'owner') {
    const { data: org } = await ctx.admin
      .from('organizations')
      .select('subscription_owner_id')
      .eq('id', input.organizationId)
      .maybeSingle()
    if (!canAssignOwnerRole(org?.subscription_owner_id, input.userId)) {
      return { ok: false, code: 'FAILED', message: ownerRoleBlockedMessage() }
    }
  }

  const { error } = await ctx.admin
    .from('organization_members')
    .update({ role: dbRole })
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { ok: true } }
}

export async function setTenantInviteRole(input: {
  organizationId: string
  inviteId: string
  role: 'owner' | 'admin' | 'member' | 'visitor'
}): Promise<TenantAdminResult<{ ok: true }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  const dbRole = normalizeRoleForDb(input.role)
  if (dbRole === 'owner') {
    return { ok: false, code: 'FAILED', message: ownerRoleBlockedMessage() }
  }

  const { error } = await ctx.admin
    .from('organization_invites')
    .update({ role: dbRole })
    .eq('organization_id', input.organizationId)
    .eq('id', input.inviteId)

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { ok: true } }
}

export async function revokeTenantInvite(input: {
  organizationId: string
  inviteId: string
}): Promise<TenantAdminResult<{ ok: true }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  const { error } = await ctx.admin
    .from('organization_invites')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('organization_id', input.organizationId)
    .eq('id', input.inviteId)
    .eq('status', 'pending')

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { ok: true } }
}

export async function removeTenantMember(input: {
  organizationId: string
  userId: string
}): Promise<TenantAdminResult<{ ok: true }>> {
  const ctx = await ensureAdmin()
  if (!ctx.ok) return ctx

  const superEmail = getSuperAdminEmail()
  if (superEmail) {
    const { data: u } = await ctx.admin.auth.admin.getUserById(input.userId)
    const email = u.user?.email ?? null
    if (isSuperAdminEmail(email)) {
      return { ok: false, code: 'FAILED', message: 'No se puede remover al super admin del tenant.' }
    }
  }

  const { error } = await ctx.admin
    .from('organization_members')
    .delete()
    .eq('organization_id', input.organizationId)
    .eq('user_id', input.userId)

  if (error) return { ok: false, code: 'FAILED', message: error.message }
  return { ok: true, data: { ok: true } }
}
