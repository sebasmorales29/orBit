import { isWithinRange, type DateRangeValue } from '@/lib/dates/range'
import type { Order } from '@/types/database'

export type OrderItemFinance = {
  order_id: string
  quantity: number
  unit_price: number
  unit_cost: number
}

export type MonthFinance = {
  revenue: number
  profit: number
  marginPercent: number | null
  salesCount: number
  itemsWithCost: number
  itemsTotal: number
}

export type WeekPoint = {
  label: string
  revenue: number
  profit: number
}

export function lineProfit(item: OrderItemFinance): number {
  const qty = Math.max(0, item.quantity)
  const price = Number(item.unit_price) || 0
  const cost = Number(item.unit_cost) || 0
  return (price - cost) * qty
}

export function orderItemsProfit(items: OrderItemFinance[]): number {
  return items.reduce((s, i) => s + lineProfit(i), 0)
}

export function computePeriodFinance(
  orders: Pick<Order, 'id' | 'total' | 'paid' | 'status' | 'created_at'>[],
  itemsByOrder: Map<string, OrderItemFinance[]>,
  range: DateRangeValue
): MonthFinance {
  const monthOrders = orders.filter(
    (o) => isWithinRange(o.created_at, range) && o.status !== 'cancelado'
  )

  let revenue = 0
  let profit = 0
  let itemsWithCost = 0
  let itemsTotal = 0

  for (const order of monthOrders) {
    const items = itemsByOrder.get(order.id) ?? []
    if (items.length > 0) {
      for (const item of items) {
        itemsTotal += 1
        if (Number(item.unit_cost) > 0) itemsWithCost += 1
        profit += lineProfit(item)
      }
      revenue += items.reduce(
        (s, i) => s + Number(i.unit_price) * Math.max(1, i.quantity),
        0
      )
    } else if (order.paid) {
      revenue += Number(order.total) || 0
    }
  }

  const marginPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : null

  return {
    revenue,
    profit,
    marginPercent,
    salesCount: monthOrders.length,
    itemsWithCost,
    itemsTotal,
  }
}

/** @deprecated Usar computePeriodFinance */
export function computeMonthFinance(
  orders: Pick<Order, 'id' | 'total' | 'paid' | 'status' | 'created_at'>[],
  itemsByOrder: Map<string, OrderItemFinance[]>,
  startOfMonth: Date
): MonthFinance {
  return computePeriodFinance(orders, itemsByOrder, {
    mode: 'range',
    preset: 'mtd',
    from: startOfMonth,
    to: new Date(),
  })
}

export function buildWeeklySeries(
  orders: Pick<Order, 'id' | 'total' | 'paid' | 'status' | 'created_at'>[],
  itemsByOrder: Map<string, OrderItemFinance[]>,
  range?: DateRangeValue,
  weeks = 6
): WeekPoint[] {
  const points: WeekPoint[] = []
  const anchorEnd = range?.to ?? new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(anchorEnd)
    end.setDate(end.getDate() - i * 7)
    end.setHours(23, 59, 59, 999)

    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    if (range && end.getTime() < range.from.getTime()) continue
    if (range && start.getTime() > range.to.getTime()) continue

    const slice = orders.filter((o) => {
      if (o.status === 'cancelado') return false
      const d = new Date(o.created_at)
      if (d < start || d > end) return false
      if (range && !isWithinRange(o.created_at, range)) return false
      return true
    })

    let revenue = 0
    let profit = 0
    for (const order of slice) {
      const items = itemsByOrder.get(order.id) ?? []
      if (items.length > 0) {
        profit += orderItemsProfit(items)
        revenue += items.reduce(
          (s, it) => s + Number(it.unit_price) * Math.max(1, it.quantity),
          0
        )
      } else if (order.paid) {
        revenue += Number(order.total) || 0
      }
    }

    const label = start.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
    points.push({ label, revenue, profit })
  }

  return points
}

export function itemsByOrderMap(
  rows: Array<{
    order_id: string
    quantity: number
    unit_price: number
    unit_cost?: number | null
  }>
): Map<string, OrderItemFinance[]> {
  const map = new Map<string, OrderItemFinance[]>()
  for (const row of rows) {
    const list = map.get(row.order_id) ?? []
    list.push({
      order_id: row.order_id,
      quantity: row.quantity,
      unit_price: Number(row.unit_price),
      unit_cost: Number(row.unit_cost ?? 0),
    })
    map.set(row.order_id, list)
  }
  return map
}
