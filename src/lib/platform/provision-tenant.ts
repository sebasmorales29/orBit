import type { User } from '@supabase/supabase-js'
import { dashboardLayoutFromProfile } from '@/lib/onboarding/personalization'
import { templatesForVertical } from '@/lib/onboarding/seed-templates'
import { assertPlatformAdmin } from '@/lib/platform/admin'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import { buildOnboardingProfileFromPack } from '@/lib/platform/build-profile'
import { getTenantPack } from '@/lib/platform/packs'
import type {
  ProvisionTenantInput,
  ProvisionTenantResult,
  TenantListResult,
  TenantListRow,
} from '@/lib/platform/types'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CurrencyCode } from '@/types/database'
import {
  emailMatchesAllowedDomains,
  ensureUniqueTenantSlug,
  isValidTenantSlug,
  slugifyTenantName,
} from '@/lib/platform/tenant-slug'

async function findUserByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string
): Promise<User | null> {
  const target = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) return match
    if (data.users.length < perPage) break
    page += 1
  }
  return null
}

async function resolveOwnerUser(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
  ownerName: string,
  appUrl: string
): Promise<{ userId: string; invited: boolean } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  const redirectTo = `${appUrl.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent('/hoy?welcome=1')}`

  let user = await findUserByEmail(admin, normalizedEmail)
  let invited = false

  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo,
      data: { full_name: ownerName.trim() },
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered')) {
        user = await findUserByEmail(admin, normalizedEmail)
      } else {
        return { error: error.message }
      }
    } else if (data.user) {
      user = data.user
      invited = true
    }
  }

  if (!user) {
    return { error: 'No se pudo crear ni encontrar el usuario del owner.' }
  }

  if (ownerName.trim()) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { full_name: ownerName.trim() },
    })
  }

  return { userId: user.id, invited }
}

export async function provisionTenant(
  input: ProvisionTenantInput
): Promise<ProvisionTenantResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    if (gate.reason === 'not_configured') {
      return {
        ok: false,
        code: 'ADMIN_NOT_CONFIGURED',
        message: 'Configurá ORBIT_PLATFORM_ADMIN_EMAILS en el servidor.',
      }
    }
    return {
      ok: false,
      code: 'NOT_AUTHORIZED',
      message: 'No tenés permiso de operador de plataforma.',
    }
  }

  const pack = getTenantPack(input.packId)
  if (!pack) {
    return { ok: false, code: 'INVALID_PACK', message: 'Pack de tenant no válido.' }
  }

  const businessName = input.businessName.trim()
  const ownerEmail = input.ownerEmail.trim().toLowerCase()
  const ownerName = input.ownerName.trim()

  if (!businessName || !ownerEmail || !ownerName) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Completá nombre, email y contacto del owner.' }
  }

  const allowedDomains = input.allowedEmailDomains ?? []
  if (!emailMatchesAllowedDomains(ownerEmail, allowedDomains)) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'El correo del owner no coincide con los dominios permitidos del tenant.',
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      code: 'ADMIN_NOT_CONFIGURED',
      message: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.',
    }
  }

  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return {
      ok: false,
      code: 'PROVISION_FAILED',
      message: `Ejecutá la migración en Supabase. Falta: ${schema.missingColumns.join(', ')}`,
    }
  }

  let slug: string | null = null
  const slugRaw = input.slug?.trim().toLowerCase() ?? slugifyTenantName(businessName)
  if (slugRaw) {
    if (!isValidTenantSlug(slugRaw)) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: 'Slug inválido para la URL pública del tenant.',
      }
    }
    slug = await ensureUniqueTenantSlug(admin, slugRaw)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const ownerResult = await resolveOwnerUser(admin, ownerEmail, ownerName, appUrl)
  if ('error' in ownerResult) {
    return { ok: false, code: 'INVITE_FAILED', message: ownerResult.error }
  }

  const { data: existingMember } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', ownerResult.userId)
    .limit(1)
    .maybeSingle()

  if (existingMember?.organization_id) {
    return {
      ok: false,
      code: 'USER_HAS_ORG',
      message: 'Ese correo ya pertenece a un negocio en orBit. Usá otro owner o ampliá el plan multi-org.',
    }
  }

  const currency = (input.currency ?? pack.defaults.currency) as CurrencyCode
  const usesStock = input.usesStock ?? pack.defaults.usesStock

  const profile = {
    ...buildOnboardingProfileFromPack(pack, ownerName, gate.email),
    provisionedOwnerEmail: ownerEmail,
  }

  const layout = dashboardLayoutFromProfile(profile, usesStock)

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: businessName,
      business_type: pack.defaults.businessTypeLabel,
      currency,
      uses_stock: usesStock,
      onboarding_completed: true,
      onboarding_profile: profile,
      created_by: ownerResult.userId,
      subscription_owner_id: ownerResult.userId,
      provisioned_source: 'ops',
      platform_status: input.platformStatus ?? 'trial',
      plan_tier: input.planTier ?? 'trial',
      monthly_fee_cents: 0,
      slug,
      max_members: input.maxMembers ?? null,
      allowed_email_domains: allowedDomains,
      is_demo: input.isDemo ?? false,
      public_url_published: Boolean(input.publicUrlPublished && slug),
    })
    .select('id')
    .single()

  if (orgError || !org) {
    return {
      ok: false,
      code: 'PROVISION_FAILED',
      message: orgError?.message ?? 'No se pudo crear la organización.',
    }
  }

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: ownerResult.userId,
    role: 'owner',
    dashboard_layout: layout,
  })

  if (memberError) {
    await admin.from('organizations').delete().eq('id', org.id)
    return {
      ok: false,
      code: 'PROVISION_FAILED',
      message: memberError.message,
    }
  }

  const templates = templatesForVertical(pack.defaults.businessTypeKey)
  if (templates.length > 0) {
    await admin.from('message_templates').insert(
      templates.map((tpl) => ({
        organization_id: org.id,
        name: tpl.name,
        category: tpl.category,
        content: tpl.content,
      }))
    )
  }

  return {
    ok: true,
    organizationId: org.id,
    ownerUserId: ownerResult.userId,
    invited: ownerResult.invited,
  }
}

function parseProfileMeta(raw: unknown): {
  packId: string | null
  ownerEmail: string | null
  ownerName: string | null
} {
  if (!raw || typeof raw !== 'object') {
    return { packId: null, ownerEmail: null, ownerName: null }
  }
  const p = raw as Record<string, unknown>
  return {
    packId: typeof p.packId === 'string' ? p.packId : null,
    ownerEmail:
      typeof p.ownerEmail === 'string'
        ? p.ownerEmail
        : typeof p.provisionedOwnerEmail === 'string'
          ? p.provisionedOwnerEmail
          : null,
    ownerName: typeof p.preferredName === 'string' ? p.preferredName : null,
  }
}

/** Listado de tenants — solo desde consola Ops (layout ya validó acceso). */
export async function queryProvisionedTenants(): Promise<TenantListResult> {
  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      code: 'ADMIN_NOT_CONFIGURED',
      message: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.',
    }
  }

  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return {
      ok: false,
      code: 'NOT_AUTHORIZED',
      message: `Migración pendiente. Columnas faltantes: ${schema.missingColumns.join(', ')}`,
    }
  }

  const { data: orgs, error } = await admin
    .from('organizations')
    .select(
      'id, name, business_type, currency, uses_stock, onboarding_completed, onboarding_profile, created_at, platform_status, plan_tier, monthly_fee_cents, slug, is_demo, public_url_published, provisioned_source, selected_plan'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return { ok: false, code: 'NOT_AUTHORIZED', message: error.message }
  }

  const orgIds = (orgs ?? []).map((o) => o.id)
  const memberCounts = new Map<string, number>()

  if (orgIds.length > 0) {
    const { data: members } = await admin
      .from('organization_members')
      .select('organization_id')
      .in('organization_id', orgIds)

    for (const m of members ?? []) {
      memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) ?? 0) + 1)
    }
  }

  const tenants: TenantListRow[] = (orgs ?? []).map((o) => {
    const meta = parseProfileMeta(o.onboarding_profile)
    return {
      id: o.id,
      name: o.name,
      business_type: o.business_type,
      currency: o.currency as CurrencyCode,
      uses_stock: o.uses_stock,
      onboarding_completed: o.onboarding_completed,
      created_at: o.created_at,
      packId: meta.packId,
      ownerEmail: meta.ownerEmail,
      ownerName: meta.ownerName,
      memberCount: memberCounts.get(o.id) ?? 0,
      platform_status: (o.platform_status ?? 'active') as TenantListRow['platform_status'],
      plan_tier: (o.plan_tier ?? 'trial') as TenantListRow['plan_tier'],
      monthly_fee_cents: o.monthly_fee_cents ?? 0,
      slug: o.slug ?? null,
      is_demo: Boolean(o.is_demo),
      public_url_published: Boolean(o.public_url_published),
      provisioned_source:
        ((o as { provisioned_source?: string }).provisioned_source as 'self_service' | 'ops') ??
        'self_service',
      selected_plan: (o as { selected_plan?: string | null }).selected_plan ?? null,
    }
  })

  return { ok: true, tenants }
}

export async function listProvisionedTenants(): Promise<TenantListResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    if (gate.reason === 'not_configured') {
      return {
        ok: false,
        code: 'ADMIN_NOT_CONFIGURED',
        message: 'Configurá ORBIT_PLATFORM_ADMIN_EMAILS en el servidor.',
      }
    }
    return {
      ok: false,
      code: 'NOT_AUTHORIZED',
      message: 'No tenés permiso de operador de plataforma.',
    }
  }
  return queryProvisionedTenants()
}
