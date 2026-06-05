import type { TenantListRow } from '@/lib/platform/types'

export type TenantListFilter = {
  source?: 'self_service' | 'ops'
  status?: 'active' | 'trial' | 'suspended'
  onboarding?: 'pending' | 'completed'
}

export function parseTenantListFilter(
  params: Record<string, string | string[] | undefined>
): TenantListFilter {
  const source = params.source
  const status = params.status
  const onboarding = params.onboarding

  return {
    source:
      source === 'self_service' || source === 'ops' ? source : undefined,
    status:
      status === 'active' || status === 'trial' || status === 'suspended'
        ? status
        : undefined,
    onboarding:
      onboarding === 'pending' || onboarding === 'completed' ? onboarding : undefined,
  }
}

export function filterTenantRows(
  tenants: TenantListRow[],
  filter: TenantListFilter
): TenantListRow[] {
  return tenants.filter((t) => {
    if (filter.source === 'ops' && t.provisioned_source !== 'ops') return false
    if (filter.source === 'self_service' && t.provisioned_source === 'ops') return false

    if (filter.onboarding === 'pending' && t.onboarding_completed) return false
    if (filter.onboarding === 'completed' && !t.onboarding_completed) return false

    const status = t.platform_status ?? 'active'
    const tier = t.plan_tier ?? 'trial'

    if (filter.status === 'suspended' && status !== 'suspended') return false
    if (filter.status === 'trial' && status !== 'trial' && tier !== 'trial') return false
    if (
      filter.status === 'active' &&
      (status === 'suspended' || status === 'trial' || tier === 'trial')
    ) {
      return false
    }

    return true
  })
}

export function tenantFilterLabel(filter: TenantListFilter): string | null {
  if (filter.source === 'self_service') return 'Self-service'
  if (filter.source === 'ops') return 'Provisionados (ops)'
  if (filter.onboarding === 'pending') return 'Onboarding pendiente'
  if (filter.status === 'active') return 'Activos'
  if (filter.status === 'trial') return 'En trial'
  if (filter.status === 'suspended') return 'Suspendidos'
  return null
}
