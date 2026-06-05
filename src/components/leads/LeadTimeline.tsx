'use client'

import { SectionLabel } from '@/components/app/SectionLabel'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export interface ActivityRow {
  id: string
  type: string
  description: string
  created_at: string
}

export function LeadTimeline({ activities }: { activities: ActivityRow[] }) {
  const { t } = useTranslations()

  if (activities.length === 0) return null

  return (
    <div>
      <SectionLabel>{t('app.lead.timeline')}</SectionLabel>
      <ul className="mt-3 space-y-0 rounded-2xl border border-border bg-surface overflow-hidden">
        {activities.map((a, i) => (
          <li
            key={a.id}
            className={
              i < activities.length - 1 ? 'border-b border-border-subtle px-4 py-3' : 'px-4 py-3'
            }
          >
            <p className="text-[13px] text-foreground">{a.description}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              {new Date(a.created_at).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
