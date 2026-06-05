'use client'

import { Sparkles } from 'lucide-react'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { generateDailyBrief } from '@/lib/ai/daily-brief'
import type { HoyDashboardData } from '@/lib/dashboard/hoy-data'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

export function HoyAiAssistant({
  data,
  embedded,
}: {
  data: HoyDashboardData
  embedded?: boolean
}) {
  const { t } = useTranslations()
  const adaptation = useBusinessAdaptation()

  const bullets = generateDailyBrief(
    {
      vertical: adaptation.vertical,
      profile: data.onboardingProfile,
      stats: data.stats,
      actions: data.actions,
      lowStockCount: data.lowStockCount,
      hasCostData: data.stats.hasCostData,
    },
    t
  )

  return (
    <section
      className={cn(
        embedded
          ? 'px-0 py-0'
          : 'rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 to-surface-raised px-5 py-4 sm:px-6'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{t('app.ai.title')}</p>
          <p className="mt-0.5 text-[11px] text-muted">{t('app.ai.subtitle')}</p>
          <ul className="mt-3 space-y-2">
            {bullets.map((line) => (
              <li
                key={line}
                className="text-[13px] leading-relaxed text-foreground/90 before:mr-2 before:text-accent before:content-['•']"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
