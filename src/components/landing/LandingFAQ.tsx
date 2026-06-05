'use client'

import { useMemo } from 'react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { LandingSection, LandingSectionHeader } from '@/components/landing/landing-layout'

export function LandingFAQ() {
  const { t } = useTranslations()

  const faqs = useMemo(
    () => [
      { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
      { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
      { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
      { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
      { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
      { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
      { q: t('landing.faq.q7'), a: t('landing.faq.a7') },
    ],
    [t]
  )

  return (
    <LandingSection id="faq" variant="raised">
      <LandingSectionHeader
        label={t('landing.faq.label')}
        title={t('landing.faq.title')}
        intro={t('landing.faq.intro')}
      />

      <div className="mt-10 max-w-3xl divide-y divide-border">
        {faqs.map((faq) => (
          <details key={faq.q} className="group py-6">
            <summary className="cursor-pointer list-none pr-8 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {faq.q}
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{faq.a}</p>
          </details>
        ))}
      </div>
    </LandingSection>
  )
}
