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
import {
  formatSaleId,
  formatShippingAddress,
  PAYMENT_METHODS,
  type ShippingAddress,
} from '@/lib/sales/format'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const STATUSES: OrderStatus[] = [
  'confirmado',
  'en_preparacion',
  'entregado',
  'cobrado',
  'cancelado',
]

export type SaleLineItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
}

interface SaleDetailProps {
  order: Order
  items: SaleLineItem[]
  currency: CurrencyCode
}

export function SaleDetail({ order: initial, items, currency }: SaleDetailProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const [order, setOrder] = useState(initial)

  const paymentLabel =
    PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.labelKey ??
    'app.sales.payment.other'

  const shipping = formatShippingAddress(order.shipping_address as ShippingAddress)
  const buyer =
    order.buyer_name?.trim() ||
    t('app.sales.unknownBuyer')

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
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {t('app.sales.saleId')}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          #{formatSaleId(order)}
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {formatMoney(order.total, currency)}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-muted">
          {order.subtotal != null && (
            <span>
              {t('app.sales.subtotal')}: {formatMoney(order.subtotal, currency)}
            </span>
          )}
          {(order.tax_amount ?? 0) > 0 && (
            <span>
              {t('app.sales.taxes')}: {formatMoney(order.tax_amount ?? 0, currency)}
            </span>
          )}
        </div>
        <p className="mt-2 text-[12px] text-muted">
          {new Date(order.created_at).toLocaleString('es-CR')}
        </p>
      </Card>

      <Card>
        <SectionLabel>{t('app.sales.buyerSection')}</SectionLabel>
        <p className="mt-2 text-[15px] font-medium text-foreground">{buyer}</p>
        {order.buyer_phone && (
          <p className="mt-1 text-[13px] text-muted">{order.buyer_phone}</p>
        )}
        {order.payment_method && (
          <p className="mt-2 text-[13px] text-muted">
            {t('app.sales.paymentMethod')}: {t(paymentLabel)}
          </p>
        )}
      </Card>

      {items.length > 0 && (
        <Card>
          <SectionLabel>{t('app.sales.itemsTitle')}</SectionLabel>
          <ul className="mt-3 divide-y divide-border-subtle">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2.5 text-[13px]">
                <div>
                  <p className="font-medium text-foreground">{item.product_name}</p>
                  <p className="text-muted">
                    {item.quantity} × {formatMoney(item.unit_price, currency)}
                  </p>
                </div>
                <p className="font-medium">
                  {formatMoney(item.quantity * item.unit_price, currency)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {shipping && (
        <Card>
          <SectionLabel>{t('app.sales.shippingTitle')}</SectionLabel>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{shipping}</p>
        </Card>
      )}

      <Card>
        <SectionLabel>{t('app.sales.statusSection')}</SectionLabel>
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
        {order.paid ? t('app.sales.markUnpaid') : t('app.sales.markPaid')}
      </button>

      {order.notes && (
        <Card>
          <SectionLabel>{t('app.sales.notes')}</SectionLabel>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{order.notes}</p>
        </Card>
      )}
    </div>
  )
}
