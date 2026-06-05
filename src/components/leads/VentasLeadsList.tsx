'use client'

import { useMemo, useState } from 'react'
import { LeadCard } from '@/components/leads/LeadCard'
import { EmptyState } from '@/components/app/EmptyState'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import type { CurrencyCode, Lead, LeadStatus } from '@/types/database'
import { INQUIRY_STATUS_LABELS } from '@/types/database'
import { cn } from '@/lib/utils'

type FilterKey = 'activos' | LeadStatus | 'todos'

interface VentasLeadsListProps {
  leads: Lead[]
  currency: CurrencyCode
}

export function VentasLeadsList({ leads, currency }: VentasLeadsListProps) {
  const { t } = useTranslations()
  const [filter, setFilter] = useState<FilterKey>('activos')

  const filtered = useMemo(() => {
    if (filter === 'todos') return leads
    if (filter === 'activos') {
      return leads.filter((l) => l.status !== 'ganado' && l.status !== 'perdido')
    }
    return leads.filter((l) => l.status === filter)
  }, [leads, filter])

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'activos', label: t('app.consultas.filterActive') },
    { key: 'nuevo', label: INQUIRY_STATUS_LABELS.nuevo },
    { key: 'cotizado', label: INQUIRY_STATUS_LABELS.cotizado },
    { key: 'por_cerrar', label: INQUIRY_STATUS_LABELS.por_cerrar },
    { key: 'ganado', label: INQUIRY_STATUS_LABELS.ganado },
    { key: 'todos', label: t('app.consultas.filterAll') },
  ]

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
              filter === tab.key
                ? 'border-accent bg-accent text-on-accent'
                : 'border-border bg-surface text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t('app.consultas.emptyTitle')}
          description={t('app.consultas.emptyHint')}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}
