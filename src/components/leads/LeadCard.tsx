'use client'

import Link from 'next/link'
import { INQUIRY_STATUS_LABELS, type LeadStatus } from '@/types/database'
import { LEAD_STATUS_CLASS } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: {
    id: string
    name: string
    phone: string | null
    product_interest: string | null
    estimated_amount: number | null
    status: LeadStatus
    last_contact_at: string
  }
  currency?: 'CRC' | 'USD'
}

export function LeadCard({ lead, currency = 'CRC' }: LeadCardProps) {
  const days = Math.floor(
    (Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const amount =
    lead.estimated_amount != null
      ? new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-CR', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(lead.estimated_amount)
      : null

  return (
    <Link
      href={`/consultas/${lead.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{lead.name}</p>
          {lead.phone && <p className="mt-0.5 text-[12px] text-muted">{lead.phone}</p>}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            LEAD_STATUS_CLASS[lead.status]
          )}
        >
          {INQUIRY_STATUS_LABELS[lead.status]}
        </span>
      </div>
      {lead.product_interest && (
        <p className="mt-2 truncate text-[12px] text-muted">{lead.product_interest}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{days === 0 ? 'Hoy' : `${days}d`}</span>
        {amount && <span className="font-medium text-foreground">{amount}</span>}
      </div>
    </Link>
  )
}
