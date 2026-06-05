'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/app/SectionLabel'
import {
  formatMoney,
  ORDER_STATUS_LABELS,
  type CurrencyCode,
  type Order,
  type OrderStatus,
} from '@/types/database'
import { cn } from '@/lib/utils'

const STATUSES: OrderStatus[] = [
  'confirmado',
  'en_preparacion',
  'entregado',
  'cobrado',
  'cancelado',
]

interface OrderDetailProps {
  order: Order
  currency: CurrencyCode
}

export function OrderDetail({ order: initial, currency }: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState(initial)

  async function updateStatus(status: OrderStatus) {
    const supabase = createClient()
    const updates: Partial<Order> = { status }
    if (status === 'cobrado') updates.paid = true
    if (status === 'entregado') updates.delivered_at = new Date().toISOString()

    const { data } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id)
      .select()
      .single()
    if (data) setOrder(data as Order)
    router.refresh()
  }

  async function togglePaid() {
    const supabase = createClient()
    const paid = !order.paid
    const { data } = await supabase
      .from('orders')
      .update({ paid, status: paid ? 'cobrado' : order.status })
      .eq('id', order.id)
      .select()
      .single()
    if (data) setOrder(data as Order)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {formatMoney(order.total, currency)}
        </p>
        <p className="mt-1 text-[12px] text-muted">
          {new Date(order.created_at).toLocaleString('es-CR')}
        </p>
      </Card>

      <Card>
        <SectionLabel>Estado</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(s)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                order.status === s
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border text-muted hover:border-accent/40 hover:text-foreground'
              )}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </Card>

      <button
        type="button"
        onClick={togglePaid}
        className={cn(
          'w-full rounded-2xl border py-3.5 text-[13px] font-medium transition-colors',
          order.paid
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'border-border bg-surface text-foreground hover:bg-surface-raised'
        )}
      >
        {order.paid ? 'Cobrado' : 'Marcar cobrado'}
      </button>

      {order.notes && (
        <Card>
          <SectionLabel>Notas</SectionLabel>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{order.notes}</p>
        </Card>
      )}
    </div>
  )
}
