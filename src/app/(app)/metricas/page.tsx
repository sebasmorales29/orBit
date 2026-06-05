import { MetricasView } from '@/components/metricas/MetricasView'
import { formatDateRangeLabel, parseDateRangeFromSearchParams } from '@/lib/dates/range'
import { periodLabelForLocale } from '@/lib/i18n/period-label'
import {
  buildWeeklySeries,
  computePeriodFinance,
  itemsByOrderMap,
} from '@/lib/metrics/finance'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from '@/i18n'
import { cookies } from 'next/headers'

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const org = await getCurrentOrganization()
  const supabase = await createClient()
  const currency = org?.currency ?? 'CRC'

  const sp = await searchParams
  const dateRange = parseDateRangeFromSearchParams(sp)

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  const t = (key: string) => periodLabelForLocale(locale, key)
  const periodLabel = formatDateRangeLabel(
    dateRange,
    t,
    locale === 'en' ? 'en-US' : 'es-CR'
  )

  let inquiriesCount = 0
  let inquiriesActive = 0
  let revenueMonth = 0
  let profitMonth = 0
  let marginPercent: number | null = null
  let hasCostData = false
  let pendingPayments = 0
  let salesMonth = 0
  let weekly: ReturnType<typeof buildWeeklySeries> = []

  if (org?.id) {
    const [leadsRes, ordersRes] = await Promise.all([
      supabase.from('leads').select('status').eq('organization_id', org.id),
      supabase
        .from('orders')
        .select('id, total, paid, status, created_at')
        .eq('organization_id', org.id),
    ])

    const leads = leadsRes.data ?? []
    inquiriesCount = leads.length
    inquiriesActive = leads.filter(
      (l) => l.status !== 'ganado' && l.status !== 'perdido'
    ).length

    const orders = ordersRes.data ?? []
    const orderIds = orders.map((o) => o.id)

    let itemsByOrder = itemsByOrderMap([])
    if (orderIds.length > 0) {
      const { data: itemRows } = await supabase
        .from('order_items')
        .select('order_id, quantity, unit_price, unit_cost')
        .in('order_id', orderIds)
      itemsByOrder = itemsByOrderMap(itemRows ?? [])
    }

    const periodFinance = computePeriodFinance(orders, itemsByOrder, dateRange)
    salesMonth = periodFinance.salesCount
    revenueMonth = periodFinance.revenue
    profitMonth = periodFinance.profit
    marginPercent = periodFinance.marginPercent
    hasCostData = periodFinance.itemsWithCost > 0

    pendingPayments = orders
      .filter((o) => !o.paid && o.status !== 'cancelado')
      .reduce((s, o) => s + Number(o.total), 0)

    weekly = buildWeeklySeries(orders, itemsByOrder, dateRange, 6)
  }

  return (
    <MetricasView
      currency={currency}
      periodLabel={periodLabel}
      salesMonth={salesMonth}
      inquiriesCount={inquiriesCount}
      inquiriesActive={inquiriesActive}
      revenueMonth={revenueMonth}
      profitMonth={profitMonth}
      marginPercent={marginPercent}
      hasCostData={hasCostData}
      pendingPayments={pendingPayments}
      weekly={weekly}
    />
  )
}
