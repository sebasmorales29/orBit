'use client'

import { useMemo } from 'react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { LandingSection, LandingSectionHeader } from '@/components/landing/landing-layout'

export function LandingHow() {
  const { t } = useTranslations()

  const steps = useMemo(
    () => [
      { n: '01', title: t('landing.how.step1Title'), body: t('landing.how.step1Body') },
      { n: '02', title: t('landing.how.step2Title'), body: t('landing.how.step2Body') },
      { n: '03', title: t('landing.how.step3Title'), body: t('landing.how.step3Body') },
      { n: '04', title: t('landing.how.step4Title'), body: t('landing.how.step4Body') },
    ],
    [t]
  )

  return (
    <LandingSection variant="raised">
      <LandingSectionHeader label={t('landing.how.label')} title={t('landing.how.title')} />

      <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {steps.map((step) => (
          <li key={step.n}>
            <p className="text-[12px] font-medium tabular-nums text-muted-foreground">{step.n}</p>
            <h3 className="mt-3 text-[15px] font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </LandingSection>
  )
}
