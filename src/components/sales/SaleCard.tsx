import Link from 'next/link'
import {
  formatMoney,
  ORDER_STATUS_LABELS,
  type CurrencyCode,
  type Order,
} from '@/types/database'
import { formatSaleId } from '@/lib/sales/format'
import { ORDER_STATUS_CLASS } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

interface SaleCardProps {
  order: Order
  currency: CurrencyCode
}

export function SaleCard({ order, currency }: SaleCardProps) {
  const buyer = order.buyer_name?.trim() || 'Cliente'

  return (
    <Link
      href={`/ventas/${order.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">
            #{formatSaleId(order)} · {buyer}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {new Date(order.created_at).toLocaleDateString('es-CR')}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            ORDER_STATUS_CLASS[order.status]
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[15px] font-semibold text-foreground">
          {formatMoney(order.total, currency)}
        </p>
        {!order.paid && order.status !== 'cancelado' && (
          <span className="text-[11px] text-muted">Por cobrar</span>
        )}
      </div>
    </Link>
  )
}
