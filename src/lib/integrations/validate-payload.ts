import type { OrbitConnectOrderPayload } from '@/lib/integrations/types'

export function validateOrderPayload(body: unknown): {
  ok: true
  payload: OrbitConnectOrderPayload
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'INVALID_BODY' }
  }

  const raw = body as Record<string, unknown>

  if (!raw.id || typeof raw.id !== 'string' || !raw.id.trim()) {
    return { ok: false, error: 'MISSING_ID' }
  }

  const customer = raw.customer
  if (!customer || typeof customer !== 'object') {
    return { ok: false, error: 'MISSING_CUSTOMER' }
  }
  const c = customer as Record<string, unknown>
  if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
    return { ok: false, error: 'MISSING_CUSTOMER_NAME' }
  }

  const order = raw.order
  if (!order || typeof order !== 'object') {
    return { ok: false, error: 'MISSING_ORDER' }
  }
  const o = order as Record<string, unknown>
  if (typeof o.total !== 'number' || Number.isNaN(o.total)) {
    return { ok: false, error: 'MISSING_ORDER_TOTAL' }
  }

  const items = Array.isArray(o.items)
    ? o.items.map((item) => {
        const i = item as Record<string, unknown>
        return {
          sku: typeof i.sku === 'string' ? i.sku : null,
          name: String(i.name ?? 'Ítem'),
          quantity: typeof i.quantity === 'number' ? i.quantity : 1,
          unit_price: typeof i.unit_price === 'number' ? i.unit_price : 0,
        }
      })
    : undefined

  const payload: OrbitConnectOrderPayload = {
    event:
      raw.event === 'order.updated' ? 'order.updated' : 'order.created',
    id: raw.id.trim(),
    source: typeof raw.source === 'string' ? raw.source.trim() : undefined,
    customer: {
      name: c.name.trim(),
      phone: typeof c.phone === 'string' ? c.phone : null,
      email: typeof c.email === 'string' ? c.email : null,
    },
    order: {
      total: o.total,
      paid: o.paid === true,
      currency: typeof o.currency === 'string' ? o.currency : undefined,
      notes: typeof o.notes === 'string' ? o.notes : null,
      items,
    },
    metadata:
      raw.metadata && typeof raw.metadata === 'object'
        ? (raw.metadata as Record<string, unknown>)
        : undefined,
  }

  return { ok: true, payload }
}
