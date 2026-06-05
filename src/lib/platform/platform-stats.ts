import { assertPlatformAdmin } from '@/lib/platform/admin'
import { checkPlatformSchema } from '@/lib/platform/schema-health'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney } from '@/types/database'

export type PlatformStats = {
  tenantsTotal: number
  tenantsActive: number
  tenantsTrial: number
  tenantsSuspended: number
  tenantsSelfService: number
  tenantsOps: number
  onboardingInProgress: number
  membersTotal: number
  contactRequestsNew: number
  ordersThisMonth: number
  gmvThisMonth: number
  gmvCurrency: 'CRC' | 'USD'
  collectedThisMonth: number
  mrrCents: number
  leadsOpen: number
  generatedAt: string
}

export type PlatformStatsResult =
  | { ok: true; stats: PlatformStats }
  | {
      ok: false
      code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED' | 'SCHEMA'
      message: string
      sqlFix?: string
    }

function monthStartIso(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

/** Datos de stats — solo usar desde páginas bajo (console)/layout (ya autenticado). */
export async function queryPlatformStats(): Promise<PlatformStatsResult> {
  const admin = createAdminClient()
  if (!admin) {
    return {
      ok: false,
      code: 'ADMIN_NOT_CONFIGURED',
      message: 'Falta SUPABASE_SERVICE_ROLE_KEY.',
    }
  }

  const schema = await checkPlatformSchema()
  if (!schema.ok) {
    return {
      ok: false,
      code: 'SCHEMA',
      message: `Faltan columnas en la base: ${schema.missingColumns.join(', ')}`,
      sqlFix: schema.sqlFix,
    }
  }

  const monthStart = monthStartIso()

  const [
    { data: orgs },
    { count: membersTotal },
    { data: monthOrders },
    { count: leadsOpen },
    { count: contactRequestsNew },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select(
        'platform_status, plan_tier, monthly_fee_cents, currency, provisioned_source, onboarding_completed'
      ),
    admin.from('organization_members').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('total, paid').gte('created_at', monthStart),
    admin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['nuevo', 'interesado', 'cotizado', 'por_cerrar']),
    admin
      .from('platform_contact_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .is('archived_at', null),
  ])

  const tenants = orgs ?? []
  let mrrCents = 0
  let tenantsActive = 0
  let tenantsTrial = 0
  let tenantsSuspended = 0
  let tenantsSelfService = 0
  let tenantsOps = 0
  let onboardingInProgress = 0

  for (const o of tenants) {
    const status = o.platform_status ?? 'active'
    const tier = o.plan_tier ?? 'trial'
    const source = (o as { provisioned_source?: string }).provisioned_source ?? 'self_service'
    if (source === 'ops') tenantsOps += 1
    else tenantsSelfService += 1
    if (!(o as { onboarding_completed?: boolean }).onboarding_completed) onboardingInProgress += 1
    if (status === 'suspended') tenantsSuspended += 1
    else if (tier === 'trial' || status === 'trial') tenantsTrial += 1
    else tenantsActive += 1
    if (status !== 'suspended') {
      mrrCents += o.monthly_fee_cents ?? 0
    }
  }

  const orders = monthOrders ?? []
  let gmvThisMonth = 0
  let collectedThisMonth = 0
  let gmvCurrency: 'CRC' | 'USD' = 'CRC'

  for (const o of orders) {
    const total = Number(o.total) || 0
    gmvThisMonth += total
    if (o.paid) collectedThisMonth += total
  }

  const usdOrgs = tenants.filter((t) => t.currency === 'USD').length
  if (usdOrgs > tenants.length / 2) gmvCurrency = 'USD'

  return {
    ok: true,
    stats: {
      tenantsTotal: tenants.length,
      tenantsActive,
      tenantsTrial,
      tenantsSuspended,
      tenantsSelfService,
      tenantsOps,
      onboardingInProgress,
      membersTotal: membersTotal ?? 0,
      contactRequestsNew: contactRequestsNew ?? 0,
      ordersThisMonth: orders.length,
      gmvThisMonth,
      gmvCurrency,
      collectedThisMonth,
      mrrCents,
      leadsOpen: leadsOpen ?? 0,
      generatedAt: new Date().toISOString(),
    },
  }
}

export async function getPlatformStats(): Promise<PlatformStatsResult> {
  const gate = await assertPlatformAdmin()
  if (!gate.ok) {
    const message =
      gate.reason === 'unauthenticated'
        ? 'Sesión expirada. Volvé a iniciar sesión y abrí /ops de nuevo.'
        : gate.reason === 'not_configured'
          ? 'Ops no está configurado en el servidor (ORBIT_PLATFORM_SUPER_ADMIN_EMAIL).'
          : 'Tu cuenta no tiene acceso a Operaciones.'
    return { ok: false, code: 'NOT_AUTHORIZED', message }
  }
  return queryPlatformStats()
}

export function formatCents(cents: number, currency: 'CRC' | 'USD' = 'CRC'): string {
  return formatMoney(cents / 100, currency)
}
