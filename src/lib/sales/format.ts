import type { Order } from '@/types/database'

export function formatSaleId(order: Pick<Order, 'sale_number' | 'id'>): string {
  if (order.sale_number != null) {
    return String(order.sale_number).padStart(5, '0')
  }
  return order.id.slice(0, 8).toUpperCase()
}

export const PAYMENT_METHODS = [
  { value: 'efectivo', labelKey: 'app.sales.payment.cash' },
  { value: 'sinpe', labelKey: 'app.sales.payment.sinpe' },
  { value: 'tarjeta', labelKey: 'app.sales.payment.card' },
  { value: 'transferencia', labelKey: 'app.sales.payment.transfer' },
  { value: 'otro', labelKey: 'app.sales.payment.other' },
] as const

export type ShippingAddress = {
  line1?: string
  line2?: string
  city?: string
  province?: string
  postal_code?: string
  notes?: string
}

export function formatShippingAddress(addr: ShippingAddress | null | undefined): string {
  if (!addr || typeof addr !== 'object') return ''
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.province].filter(Boolean).join(', '),
    addr.postal_code,
    addr.notes,
  ].filter((p) => p && String(p).trim())
  return parts.join(' · ')
}
