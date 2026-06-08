/** Velum Connect v1 — cuerpo para pedidos entrantes desde tienda / webhook. */
export type OrbitConnectOrderPayload = {
  event?: 'order.created' | 'order.updated'
  /** ID único en el sistema origen (evita duplicados). */
  id: string
  /** Origen lógico: shopify, woocommerce, mi_tienda, etc. */
  source?: string
  customer: {
    name: string
    phone?: string | null
    email?: string | null
  }
  order: {
    total: number
    subtotal?: number
    tax_amount?: number
    paid?: boolean
    currency?: string
    notes?: string | null
    items?: Array<{
      sku?: string | null
      name: string
      quantity: number
      unit_price: number
    }>
  }
  metadata?: Record<string, unknown>
}

export type ProcessInboundOrderResult = {
  ok: true
  duplicate?: boolean
  orderId: string
  customerId: string | null
  classification: {
    orderStatus: string
    paid: boolean
    matchedProducts: number
    createdTask: boolean
  }
}

export type IntegrationConnectionRow = {
  id: string
  organization_id: string
  name: string
  provider: string
  secret_prefix: string
  active: boolean
  settings: Record<string, unknown>
  last_used_at: string | null
  created_at: string
}
