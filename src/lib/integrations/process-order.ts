import type { SupabaseClient } from '@supabase/supabase-js'
import { classifyInboundOrder } from '@/lib/integrations/classify-order'
import type {
  OrbitConnectOrderPayload,
  ProcessInboundOrderResult,
} from '@/lib/integrations/types'
import type { Organization } from '@/types/database'

async function findOrCreateCustomer(
  supabase: SupabaseClient,
  orgId: string,
  customer: OrbitConnectOrderPayload['customer'],
  orderTotal: number
): Promise<string | null> {
  const phone = customer.phone?.trim() || null

  if (phone) {
    const { data: byPhone } = await supabase
      .from('customers')
      .select('id, total_spent')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .maybeSingle()

    if (byPhone?.id) {
      await supabase
        .from('customers')
        .update({
          total_spent: Number(byPhone.total_spent ?? 0) + orderTotal,
          last_order_at: new Date().toISOString(),
        })
        .eq('id', byPhone.id)
      return byPhone.id
    }
  }

  const { data: created, error } = await supabase
    .from('customers')
    .insert({
      organization_id: orgId,
      name: customer.name.trim() || 'Cliente',
      phone,
      total_spent: orderTotal,
      last_order_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return null
  return created?.id ?? null
}

async function matchProducts(
  supabase: SupabaseClient,
  orgId: string,
  items: NonNullable<OrbitConnectOrderPayload['order']['items']>
) {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, price, unit_cost')
    .eq('organization_id', orgId)

  const catalog = products ?? []
  const matched: Array<{
    product_id: string | null
    product_name: string
    quantity: number
    unit_price: number
    unit_cost: number
  }> = []

  for (const item of items) {
    const sku = item.sku?.trim()
    const nameLower = item.name.trim().toLowerCase()
    let product =
      (sku ? catalog.find((p) => p.sku && p.sku === sku) : undefined) ??
      catalog.find((p) => p.name.trim().toLowerCase() === nameLower)

    matched.push({
      product_id: product?.id ?? null,
      product_name: item.name,
      quantity: Math.max(1, item.quantity),
      unit_price: item.unit_price ?? product?.price ?? 0,
      unit_cost: Number(product?.unit_cost ?? 0),
    })
  }

  return matched
}

export async function processInboundOrder(
  supabase: SupabaseClient,
  connection: { id: string; organization_id: string; settings?: Record<string, unknown> },
  org: Organization,
  payload: OrbitConnectOrderPayload
): Promise<ProcessInboundOrderResult> {
  const orgId = connection.organization_id
  const externalId = payload.id.trim()
  const externalSource =
    (payload.source?.trim() || (connection.settings?.default_source as string) || 'connect') as string

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('organization_id', orgId)
    .eq('external_source', externalSource)
    .eq('external_id', externalId)
    .maybeSingle()

  if (existing?.id) {
    return {
      ok: true,
      duplicate: true,
      orderId: existing.id,
      customerId: null,
      classification: {
        orderStatus: 'confirmado',
        paid: payload.order.paid === true,
        matchedProducts: 0,
        createdTask: false,
      },
    }
  }

  const classification = classifyInboundOrder(org, payload)
  const total = Number(payload.order.total) || 0
  const customerId = await findOrCreateCustomer(supabase, orgId, payload.customer, total)

  const baseNotes = payload.order.notes?.trim() ?? ''
  const notes = baseNotes
    ? `${baseNotes}${classification.notesSuffix}`
    : `Pedido desde ${externalSource}${classification.notesSuffix}`.trim()

  const shipping = payload.metadata?.shipping_address as Record<string, unknown> | undefined
  const paymentMethod =
    typeof payload.metadata?.payment_method === 'string'
      ? payload.metadata.payment_method
      : classification.paid
        ? 'otro'
        : null

  const taxAmount =
    typeof payload.order.tax_amount === 'number' ? payload.order.tax_amount : 0
  const subtotal =
    typeof payload.order.subtotal === 'number'
      ? payload.order.subtotal
      : total - taxAmount

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      buyer_name: payload.customer.name.trim(),
      buyer_phone: payload.customer.phone?.trim() || null,
      subtotal,
      tax_amount: taxAmount,
      payment_method: paymentMethod,
      shipping_address: shipping ?? {},
      status: classification.orderStatus,
      total,
      paid: classification.paid,
      notes,
      external_id: externalId,
      external_source: externalSource,
      source_metadata: {
        connect_version: 1,
        event: payload.event ?? 'order.created',
        metadata: payload.metadata ?? {},
        customer_email: payload.customer.email ?? null,
      },
    })
    .select('id')
    .single()

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'ORDER_INSERT_FAILED')
  }

  let matchedProducts = 0
  const items = payload.order.items ?? []
  if (items.length > 0) {
    const rows = await matchProducts(supabase, orgId, items)
    matchedProducts = rows.filter((r) => r.product_id).length
    await supabase.from('order_items').insert(
      rows.map((r) => ({
        order_id: order.id,
        product_id: r.product_id,
        product_name: r.product_name,
        quantity: r.quantity,
        unit_price: r.unit_price,
        unit_cost: r.unit_cost,
      }))
    )
  }

  let createdTask = false
  if (classification.shouldCreatePaymentTask) {
    await supabase.from('tasks').insert({
      organization_id: orgId,
      type: 'collect_payment',
      title: `Cobrar pedido · ${payload.customer.name}`,
      description: `Pedido ${externalId} · ${total}`,
      order_id: order.id,
      priority: 2,
    })
    createdTask = true
  } else if (classification.shouldCreatePrepareTask) {
    await supabase.from('tasks').insert({
      organization_id: orgId,
      type: 'prepare_order',
      title: `Preparar pedido · ${payload.customer.name}`,
      description: notes.slice(0, 200),
      order_id: order.id,
      priority: 2,
    })
    createdTask = true
  }

  await supabase.from('activities').insert({
    organization_id: orgId,
    type: 'integration_order',
    description: `Pedido entrante (${externalSource}) · ${payload.customer.name}`,
    order_id: order.id,
    metadata: {
      connection_id: connection.id,
      external_id: externalId,
      external_source: externalSource,
      classification,
    },
  })

  await supabase
    .from('integration_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', connection.id)

  return {
    ok: true,
    orderId: order.id,
    customerId,
    classification: {
      orderStatus: classification.orderStatus,
      paid: classification.paid,
      matchedProducts,
      createdTask,
    },
  }
}
