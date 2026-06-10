'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { interactivePressSolidClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { getMessages } from '@/i18n'
import { LandingSection, LandingSectionHeader } from '@/components/landing/landing-layout'
import { useTranslations } from '@/components/i18n/LocaleProvider'

type BillingCycle = 'monthly' | 'semiannual' | 'annual'
type PlanId = 'operativo' | 'profesional' | 'equipo'

const PLAN_ORDER: PlanId[] = ['operativo', 'profesional', 'equipo']

const MONTHLY_BASE: Record<PlanId, number> = {
  operativo: 38,
  profesional: 49,
  equipo: 68,
}

const CYCLE_FACTOR: Record<BillingCycle, number> = {
  monthly: 1,
  semiannual: 0.88,
  annual: 0.82,
}

function pricePerMonth(plan: PlanId, cycle: BillingCycle): number {
  return Math.round(MONTHLY_BASE[plan] * CYCLE_FACTOR[cycle])
}

export function LandingPricing() {
  const { t, locale } = useTranslations()
  const [cycle, setCycle] = useState<BillingCycle>('annual')

  const messages = getMessages(locale).landing.pricing
  const plans = messages.plans

  const cycles = useMemo(
    () =>
      [
        {
          id: 'monthly' as const,
          label: t('landing.pricing.monthly'),
          savings: undefined as string | undefined,
        },
        {
          id: 'semiannual' as const,
          label: t('landing.pricing.semiannual'),
          savings: '−12%',
        },
        {
          id: 'annual' as const,
          label: t('landing.pricing.annual'),
          savings: '−18%',
        },
      ],
    [t]
  )

  const billedHint = t(`landing.pricing.billedHint_${cycle}`)

  return (
    <LandingSection id="pricing">
      <LandingSectionHeader
        label={t('landing.pricing.label')}
        title={t('landing.pricing.title')}
        intro={t('landing.pricing.intro')}
      />

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <SegmentedControl<BillingCycle>
          value={cycle}
          onChange={setCycle}
          ariaLabel={t('landing.pricing.billingLabel')}
          thumbVariant="foreground"
          options={cycles.map((c) => ({
            id: c.id,
            label: (
              <>
                {c.label}
                {c.savings && (
                  <span
                    className={cn(
                      'ml-1.5 text-[11px] font-medium',
                      cycle === c.id ? 'text-surface/70' : 'text-muted-foreground'
                    )}
                  >
                    {c.savings}
                  </span>
                )}
              </>
            ),
          }))}
          className="shadow-sm dark:shadow-none"
        />
        <p className="text-[12px] text-muted-foreground">{billedHint}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {PLAN_ORDER.map((planId) => {
          const plan = plans[planId]
          const popular = planId === 'profesional'
          const monthly = pricePerMonth(planId, cycle)

          return (
            <article
              key={planId}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-surface-raised p-6 shadow-[0_8px_32px_rgb(22_24_28/0.06)] sm:p-7 dark:shadow-none',
                popular
                  ? 'border-foreground/25 ring-2 ring-foreground/10 lg:scale-[1.02] lg:shadow-lg'
                  : 'border-border-subtle dark:border-border'
              )}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-surface">
                  {t('landing.pricing.popularBadge')}
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{plan.tagline}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  ${monthly}
                </span>
                <span className="text-[13px] text-muted">{t('landing.pricing.perMonth')}</span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">{plan.priceNote}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={cn(
                  'mt-8 flex w-full items-center justify-center rounded-full py-3 text-[14px] font-medium hover:opacity-95',
                  popular
                    ? 'bg-foreground text-surface'
                    : 'border border-border bg-surface-raised text-foreground hover:bg-surface-hover',
                  interactivePressSolidClass
                )}
              >
                {t('landing.pricing.ctaPlan')}
              </Link>
            </article>
          )
        })}
      </div>

      <p className="mt-8 max-w-3xl text-[13px] leading-relaxed text-muted">
        {t('landing.pricing.compareNote')}
      </p>
      <p className="mt-2 text-[12px] text-muted-foreground">{t('landing.pricing.trustLine')}</p>
    </LandingSection>
  )
}
