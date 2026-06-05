'use client'

import { DASHBOARD_WIDGET_META } from '@/lib/dashboard/widget-meta'
import type { DashboardWidgetId } from '@/lib/dashboard/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const WIDGET_IDS: DashboardWidgetId[] = [
  'greeting',
  'ai_assistant',
  'kpis',
  'priorities',
  'quick_actions',
  'pipeline',
  'recent_leads',
  'low_stock',
]

export function OnboardingDashboardStep({
  prefs,
  usesStock,
  onToggle,
}: {
  prefs: Partial<Record<DashboardWidgetId, boolean>>
  usesStock: boolean
  onToggle: (id: DashboardWidgetId, enabled: boolean) => void
}) {
  const { t } = useTranslations()

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] font-medium text-accent">{t('onboarding.step7Eyebrow')}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step7Title')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t('onboarding.step7Subtitle')}</p>
      </header>

      <ul className="space-y-2">
        {WIDGET_IDS.map((id) => {
          if (id === 'low_stock' && !usesStock) return null
          const meta = DASHBOARD_WIDGET_META.find((m) => m.id === id)
          const locked = id === 'greeting'
          const enabled = prefs[id] ?? false

          return (
            <li key={id}>
              <label
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors',
                  enabled ? 'border-accent/40 bg-accent-soft/30' : 'border-border bg-surface-raised',
                  locked && 'cursor-default opacity-80'
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-foreground">
                    {meta ? t(meta.labelKey) : id}
                  </p>
                  {meta && (
                    <p className="mt-0.5 text-[12px] text-muted">{t(meta.descriptionKey)}</p>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={enabled || locked}
                  disabled={locked}
                  onChange={(e) => onToggle(id, e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>
            </li>
          )
        })}
      </ul>

      <p className="text-[12px] leading-relaxed text-muted">{t('onboarding.step7Hint')}</p>
    </div>
  )
}
