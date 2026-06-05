'use client'

import Link from 'next/link'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { interactivePressSolidClass } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { LandingSection } from '@/components/landing/landing-layout'

export function LandingCTA() {
  const { t } = useTranslations()

  return (
    <LandingSection>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('landing.cta.title')}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{t('landing.cta.body')}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-[14px] font-medium text-surface hover:opacity-95',
              interactivePressSolidClass
            )}
          >
            {t('landing.cta.createAccount')}
          </Link>
          <Link
            href="/login"
            className={cn(
              'inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-8 py-3.5 text-[14px] font-medium text-foreground hover:bg-white hover:shadow-sm dark:bg-transparent dark:hover:bg-surface-raised',
              interactivePressSolidClass
            )}
          >
            {t('landing.cta.haveAccount')}
          </Link>
        </div>
      </div>
    </LandingSection>
  )
}
