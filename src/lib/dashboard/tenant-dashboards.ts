import { normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayoutV2 } from '@/lib/dashboard/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type DashboardVisibility = 'private' | 'public'

export interface TenantDashboardListItem {
  id: string
  name: string
  visibility: DashboardVisibility
  created_by: string
  is_mine: boolean
  updated_at: string
}

export interface TenantDashboardRecord extends TenantDashboardListItem {
  layout: DashboardLayoutV2
}

function rowToListItem(
  row: {
    id: string
    name: string
    visibility: string
    created_by: string
    updated_at: string
  },
  userId: string
): TenantDashboardListItem {
  return {
    id: row.id,
    name: row.name,
    visibility: row.visibility as DashboardVisibility,
    created_by: row.created_by,
    is_mine: row.created_by === userId,
    updated_at: row.updated_at,
  }
}

export async function listTenantDashboards(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<TenantDashboardListItem[]> {
  const { data, error } = await supabase
    .from('tenant_dashboards')
    .select('id, name, visibility, created_by, updated_at')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => rowToListItem(r, userId))
}

export async function getTenantDashboard(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  usesStock: boolean
): Promise<TenantDashboardRecord | null> {
  const { data, error } = await supabase
    .from('tenant_dashboards')
    .select('id, name, visibility, created_by, updated_at, layout, organization_id')
    .eq('id', dashboardId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    ...rowToListItem(data, userId),
    layout: normalizeLayout(data.layout, usesStock),
  }
}

export async function getMemberActiveDashboardId(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('organization_members')
    .select('active_dashboard_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  return data?.active_dashboard_id ?? null
}

export async function setMemberActiveDashboard(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  dashboardId: string,
  layout: DashboardLayoutV2
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({
      active_dashboard_id: dashboardId,
      dashboard_layout: layout,
    })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function createTenantDashboard(
  supabase: SupabaseClient,
  input: {
    organizationId: string
    userId: string
    name: string
    layout: DashboardLayoutV2
    visibility?: DashboardVisibility
    usesStock: boolean
  }
): Promise<TenantDashboardRecord> {
  const { data, error } = await supabase
    .from('tenant_dashboards')
    .insert({
      organization_id: input.organizationId,
      created_by: input.userId,
      name: input.name.trim(),
      layout: input.layout,
      visibility: input.visibility ?? 'private',
    })
    .select('id, name, visibility, created_by, updated_at, layout')
    .single()

  if (error) throw error

  const record: TenantDashboardRecord = {
    ...rowToListItem(data, input.userId),
    is_mine: true,
    layout: normalizeLayout(data.layout, input.usesStock),
  }

  await setMemberActiveDashboard(
    supabase,
    input.organizationId,
    input.userId,
    data.id,
    record.layout
  )

  return record
}

export async function updateTenantDashboard(
  supabase: SupabaseClient,
  input: {
    dashboardId: string
    organizationId: string
    userId: string
    name: string
    layout: DashboardLayoutV2
    visibility: DashboardVisibility
    usesStock: boolean
  }
): Promise<TenantDashboardRecord> {
  const { data, error } = await supabase
    .from('tenant_dashboards')
    .update({
      name: input.name.trim(),
      layout: input.layout,
      visibility: input.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.dashboardId)
    .eq('created_by', input.userId)
    .select('id, name, visibility, created_by, updated_at, layout')
    .single()

  if (error) throw error

  const layout = normalizeLayout(data.layout, input.usesStock)

  await setMemberActiveDashboard(
    supabase,
    input.organizationId,
    input.userId,
    input.dashboardId,
    layout
  )

  return {
    ...rowToListItem(data, input.userId),
    is_mine: true,
    layout,
  }
}

export async function activateTenantDashboard(
  supabase: SupabaseClient,
  input: {
    dashboardId: string
    organizationId: string
    userId: string
    usesStock: boolean
  }
): Promise<DashboardLayoutV2 | null> {
  const { data, error } = await supabase
    .from('tenant_dashboards')
    .select('id, layout')
    .eq('id', input.dashboardId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const layout = normalizeLayout(data.layout, input.usesStock)
  await setMemberActiveDashboard(
    supabase,
    input.organizationId,
    input.userId,
    input.dashboardId,
    layout
  )
  return layout
}

/** Migra el layout suelto del member a un panel "Mi panel" si aún no hay ninguno. */
export async function ensureDefaultTenantDashboard(
  supabase: SupabaseClient,
  input: {
    organizationId: string
    userId: string
    usesStock: boolean
    fallbackLayout: DashboardLayoutV2
    defaultName: string
  }
): Promise<{ dashboards: TenantDashboardListItem[]; activeId: string; layout: DashboardLayoutV2 }> {
  let list = await listTenantDashboards(supabase, input.organizationId, input.userId)

  let activeId = await getMemberActiveDashboardId(
    supabase,
    input.organizationId,
    input.userId
  )

  if (list.length === 0) {
    const created = await createTenantDashboard(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      name: input.defaultName,
      layout: input.fallbackLayout,
      visibility: 'private',
      usesStock: input.usesStock,
    })
    list = [rowToListItem(created, input.userId)]
    activeId = created.id
    return { dashboards: list, activeId, layout: created.layout }
  }

  if (!activeId || !list.some((d) => d.id === activeId)) {
    activeId = list.find((d) => d.is_mine)?.id ?? list[0].id
    const full = await getTenantDashboard(supabase, activeId, input.userId, input.usesStock)
    if (full) {
      await setMemberActiveDashboard(
        supabase,
        input.organizationId,
        input.userId,
        activeId,
        full.layout
      )
      return { dashboards: list, activeId, layout: full.layout }
    }
  }

  const active = await getTenantDashboard(supabase, activeId!, input.userId, input.usesStock)
  const layout = active?.layout ?? input.fallbackLayout

  return { dashboards: list, activeId: activeId!, layout }
}
