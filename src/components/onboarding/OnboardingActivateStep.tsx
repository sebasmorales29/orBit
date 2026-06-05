'use client'

import { useMemo, useState } from 'react'
import { Crown, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { checkoutAmountCents, pricePerMonthUsd } from '@/lib/billing/pricing'
import type { BillingCycle } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { formatMoney } from '@/types/database'
import { cn } from '@/lib/utils'

export function OnboardingActivateStep({
  preferredName,
  businessName,
  planId,
  loading,
  onActivate,
  canceled,
}: {
  preferredName: string
  businessName: string
  planId: SubscriptionPlanId
  loading: boolean
  onActivate: (cycle: BillingCycle) => void
  canceled?: boolean
}) {
  const { t } = useTranslations()
  const [cycle, setCycle] = useState<BillingCycle>('annual')

  const perMonth = pricePerMonthUsd(planId, cycle)
  const totalCents = checkoutAmountCents(planId, cycle)

  const cycleOptions = useMemo(
    () => [
      { id: 'monthly' as const, label: t('billing.cycle.monthly') },
      { id: 'semiannual' as const, label: t('billing.cycle.semiannual') },
      { id: 'annual' as const, label: t('billing.cycle.annual') },
    ],
    [t]
  )

  return (
    <div className="space-y-6">
      <header className="text-center sm:text-left">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft/50 px-3 py-1 text-[11px] font-medium text-accent">
          <Crown className="h-3.5 w-3.5" strokeWidth={2} />
          {t('onboarding.step8Eyebrow')}
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {t('onboarding.step8Title', { name: preferredName })}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t('onboarding.step8Subtitle')}</p>
      </header>

      {canceled && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          {t('onboarding.step8Canceled')}
        </p>
      )}

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {t('onboarding.step8OrderTitle')}
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground">{businessName}</p>
        <p className="text-[13px] text-muted">
          {t(`landing.pricing.plans.${planId}.name`)} · {t(`landing.pricing.plans.${planId}.tagline`)}
        </p>

        <div className="mt-5">
          <SegmentedControl<BillingCycle>
            value={cycle}
            onChange={setCycle}
            fullWidth
            shape="rounded"
            thumbVariant="foreground"
            options={cycleOptions}
          />
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border-subtle pt-5">
          <div>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {formatMoney(totalCents / 100, 'USD')}
            </p>
            <p className="text-[12px] text-muted">
              {t('onboarding.step8TotalHint', { perMonth: String(perMonth) })}
            </p>
          </div>
          <div className="text-right text-[12px] text-muted">
            <p>{t('onboarding.step8Secure')}</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2 text-[13px] text-muted">
        <li className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t('onboarding.step8Perk1')}
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t('onboarding.step8Perk2')}
        </li>
        <li className="flex items-start gap-2">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {t('onboarding.step8Perk3')}
        </li>
      </ul>

      <p className="text-center text-[12px] text-muted-foreground">{t('onboarding.step8ProviderNote')}</p>

      <button
        type="button"
        disabled={loading}
        onClick={() => onActivate(cycle)}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-[15px] font-semibold text-surface transition-opacity hover:opacity-95 disabled:opacity-60',
          loading && 'cursor-wait'
        )}
      >
        {loading ? t('onboarding.step8Activating') : t('onboarding.step8Cta')}
      </button>
    </div>
  )
}
