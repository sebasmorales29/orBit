'use client'

import { getMessages } from '@/i18n'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { LandingSection, LandingSectionHeader } from '@/components/landing/landing-layout'

export function LandingFeatures() {
  const { t, locale } = useTranslations()
  const features = getMessages(locale).landing.features.items

  return (
    <LandingSection id="features">
      <LandingSectionHeader
        label={t('landing.features.label')}
        title={t('landing.features.title')}
        intro={t('landing.features.intro')}
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-[0_4px_24px_rgb(22_24_28/0.05)] sm:p-10 dark:border-border dark:shadow-none dark:backdrop-blur-sm"
          >
            <h3 className="text-[16px] font-semibold text-foreground">{f.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{f.description}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  )
}
