import type { SupabaseClient } from '@supabase/supabase-js'
import { buildTodayActions } from '@/lib/hoy/actions'
import { defaultDateRange, formatDateRangeLabel, type DateRangeValue } from '@/lib/dates/range'
import { computePeriodFinance, itemsByOrderMap } from '@/lib/metrics/finance'
import { mergeDashboardLayout } from '@/lib/dashboard/defaults'
import type { DashboardLayoutV2 } from '@/lib/dashboard/types'
import { parseOnboardingProfile } from '@/lib/onboarding/personalization'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type {
  CurrencyCode,
  Lead,
  LeadStatus,
  Order,
  Organization,
  Product,
  Task,
} from '@/types/database'

export interface HoyDashboardData {
  orgId: string
  orgName: string
  currency: CurrencyCode
  usesStock: boolean
  userId: string
  displayName: string
  welcomeLine: string
  onboardingProfile: OnboardingProfile | null
  dateLabel: string
  periodLabel: string
  dateRange: DateRangeValue
  stats: {
    activeLeads: number
    openOrders: number
    revenueMonth: number
    profitMonth: number
    marginPercent: number | null
    hasCostData: boolean
    pendingCollect: number
  }
  lowStockCount: number
  actions: ReturnType<typeof buildTodayActions>
  hasAnyData: boolean
  pipeline: Partial<Record<LeadStatus, number>>
  recentLeads: Pick<
    Lead,
    'id' | 'name' | 'status' | 'last_contact_at' | 'estimated_amount' | 'product_interest'
  >[]
  lowStockProducts: Pick<Product, 'id' | 'name' | 'stock' | 'stock_minimum'>[]
  layout: DashboardLayoutV2
  activeDashboardId: string | null
  activeDashboardName: string | null
  activeDashboardVisibility: 'private' | 'public' | null
}

function greetingForHour(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export async function loadHoyDashboardData(
  supabase: SupabaseClient,
  org: Organization,
  user: { id: string; user_metadata?: Record<string, unknown>; email?: string | null },
  dateRange: DateRangeValue = defaultDateRange(),
  translate: (key: string) => string = (key) => key
): Promise<HoyDashboardData> {

  const ordersQuery = supabase
    .from('orders')
    .select('*')
    .eq('organization_id', org.id)
    .not('status', 'eq', 'cancelado')

  const [leadsRes, ordersRes, productsRes, tasksRes, memberRes] = await Promise.all([
    supabase.from('leads').select('*').eq('organization_id', org.id),
    ordersQuery,
    org.uses_stock
      ? supabase.from('products').select('*').eq('organization_id', org.id)
      : Promise.resolve({ data: [] as Product[] }),
    supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', org.id)
      .eq('completed', false),
    supabase
      .from('organization_members')
      .select('dashboard_layout, active_dashboard_id')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  let activeDashboardId = memberRes.data?.active_dashboard_id ?? null
  let activeDashboardName: string | null = null
  let activeDashboardVisibility: 'private' | 'public' | null = null
  let resolvedLayout = mergeDashboardLayout(memberRes.data?.dashboard_layout, org.uses_stock)

  if (activeDashboardId) {
    const { data: dashRow } = await supabase
      .from('tenant_dashboards')
      .select('name, visibility, layout')
      .eq('id', activeDashboardId)
      .eq('organization_id', org.id)
      .maybeSingle()

    if (dashRow) {
      activeDashboardName = dashRow.name
      activeDashboardVisibility = dashRow.visibility as 'private' | 'public'
      resolvedLayout = mergeDashboardLayout(dashRow.layout, org.uses_stock)
    } else {
      activeDashboardId = null
    }
  }

  const leads = (leadsRes.data ?? []) as Lead[]
  const orders = (ordersRes.data ?? []) as Order[]
  const products = (productsRes.data ?? []) as Product[]
  const tasks = (tasksRes.data ?? []) as Task[]

  const orderIds = orders.map((o) => o.id)
  let itemsByOrder = itemsByOrderMap([])
  if (orderIds.length > 0) {
    const { data: itemRows } = await supabase
      .from('order_items')
      .select('order_id, quantity, unit_price, unit_cost')
      .in('order_id', orderIds)
    itemsByOrder = itemsByOrderMap(itemRows ?? [])
  }

  const monthFinance = computePeriodFinance(orders, itemsByOrder, dateRange)

  const activeLeads = leads.filter((l) => l.status !== 'ganado' && l.status !== 'perdido')
  const pipelineStatuses: LeadStatus[] = ['nuevo', 'interesado', 'cotizado', 'por_cerrar']
  const pipeline: Partial<Record<LeadStatus, number>> = {}
  for (const s of pipelineStatuses) {
    pipeline[s] = activeLeads.filter((l) => l.status === s).length
  }

  const recentLeads = [...activeLeads]
    .sort(
      (a, b) =>
        new Date(a.last_contact_at).getTime() - new Date(b.last_contact_at).getTime()
    )
    .slice(0, 5)

  const lowStockProducts = products
    .filter((p) => p.stock <= p.stock_minimum)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  const now = new Date()
  const greetKey = greetingForHour(now.getHours())
  const greetings = { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' }
  const profile = parseOnboardingProfile(org.onboarding_profile)
  const displayName =
    profile?.preferredName?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    ''

  const welcomeLine = displayName
    ? `${greetings[greetKey]}, ${displayName}`
    : greetings[greetKey]

  return {
    orgId: org.id,
    orgName: org.name,
    currency: org.currency,
    usesStock: org.uses_stock,
    userId: user.id,
    displayName,
    welcomeLine,
    onboardingProfile: profile,
    dateLabel: now.toLocaleDateString('es-CR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    periodLabel: formatDateRangeLabel(dateRange, translate, 'es-CR'),
    dateRange,
    stats: {
      activeLeads: activeLeads.length,
      openOrders: orders.filter((o) => o.status !== 'cobrado').length,
      revenueMonth: monthFinance.revenue,
      profitMonth: monthFinance.profit,
      marginPercent: monthFinance.marginPercent,
      hasCostData: monthFinance.itemsWithCost > 0,
      pendingCollect: orders
        .filter((o) => !o.paid && o.status !== 'cancelado')
        .reduce((s, o) => s + Number(o.total), 0),
    },
    lowStockCount: products.filter((p) => p.stock <= p.stock_minimum).length,
    actions: buildTodayActions(leads, orders, products, tasks),
    hasAnyData:
      leads.length > 0 || orders.length > 0 || products.length > 0 || tasks.length > 0,
    pipeline,
    recentLeads,
    lowStockProducts,
    layout: resolvedLayout,
    activeDashboardId,
    activeDashboardName,
    activeDashboardVisibility,
  }
}
