import { formatSaleId } from '@/lib/sales/format'
import type { Lead, Order, Product, Task, TodayAction } from '@/types/database'
import { daysSince } from '@/types/database'

const COLD_LEAD_DAYS = 2

export function buildTodayActions(
  leads: Lead[],
  orders: Order[],
  products: Product[],
  tasks: Task[]
): TodayAction[] {
  const actions: TodayAction[] = []

  for (const lead of leads) {
    if (lead.status === 'perdido' || lead.status === 'ganado') continue
    const days = daysSince(lead.last_contact_at)
    if (days >= COLD_LEAD_DAYS) {
      actions.push({
        id: `lead-${lead.id}`,
        type: 'follow_up',
        title: `Seguir a ${lead.name}`,
        subtitle: `${days} días sin contacto · ${lead.status}`,
        urgency: days >= 5 ? 'high' : days >= 3 ? 'medium' : 'low',
        amount: lead.estimated_amount ?? undefined,
        href: `/consultas/${lead.id}`,
      })
    }
    if (lead.status === 'por_cerrar') {
      actions.push({
        id: `close-${lead.id}`,
        type: 'follow_up',
        title: `Cerrar venta con ${lead.name}`,
        subtitle: 'Lead por cerrar — alta prioridad',
        urgency: 'high',
        amount: lead.estimated_amount ?? undefined,
        href: `/consultas/${lead.id}`,
      })
    }
  }

  for (const order of orders) {
    if (order.status === 'confirmado' || order.status === 'en_preparacion') {
      actions.push({
        id: `prep-${order.id}`,
        type: 'prepare_order',
        title: `Preparar venta #${formatSaleId(order)}`,
        subtitle: ORDER_LABEL[order.status],
        urgency: order.status === 'confirmado' ? 'high' : 'medium',
        amount: order.total,
        href: `/ventas/${order.id}`,
      })
    }
    if (order.status === 'entregado' && !order.paid) {
      actions.push({
        id: `pay-${order.id}`,
        type: 'collect_payment',
        title: `Cobrar venta #${formatSaleId(order)}`,
        subtitle: 'Entregado, pendiente de cobro',
        urgency: 'high',
        amount: order.total,
        href: `/ventas/${order.id}`,
      })
    }
  }

  for (const product of products) {
    if (product.stock <= product.stock_minimum) {
      actions.push({
        id: `stock-${product.id}`,
        type: 'restock',
        title: `Reponer ${product.name}`,
        subtitle: `Quedan ${product.stock} unidades (mín: ${product.stock_minimum})`,
        urgency: product.stock === 0 ? 'high' : 'medium',
        href: '/stock',
      })
    }
  }

  for (const task of tasks.filter((t) => !t.completed)) {
    actions.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      subtitle: task.description ?? 'Tarea pendiente',
      urgency: task.priority >= 2 ? 'high' : task.priority >= 1 ? 'medium' : 'low',
      href: '/hoy',
    })
  }

  const urgencyOrder = { high: 0, medium: 1, low: 2 }
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
}

const ORDER_LABEL: Record<Order['status'], string> = {
  confirmado: 'Confirmado — preparar ya',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
  cobrado: 'Cobrado',
  cancelado: 'Cancelado',
}

