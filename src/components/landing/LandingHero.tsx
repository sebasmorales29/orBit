'use client'

import Link from 'next/link'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { landingContainerClass } from '@/components/landing/landing-layout'
import { LandingProductPreview } from '@/components/landing/LandingProductPreview'
import { interactivePressSolidClass } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function LandingHero() {
  const { t } = useTranslations()

  return (
    <section className="pt-[4.75rem] sm:pt-[5.5rem]">
      <div
        className={cn(
          landingContainerClass,
          'grid gap-12 py-16 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24'
        )}
      >
        <div className="max-w-xl lg:max-w-none">
          <h1 className="text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.125rem]">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed text-muted sm:text-[17px]">
            {t('landing.hero.body1')}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            {t('landing.hero.body2')}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/signup"
              className={cn(
                'inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-[14px] font-medium text-surface hover:opacity-95',
                interactivePressSolidClass
              )}
            >
              {t('nav.trialCta')}
            </Link>
            <Link
              href="/login"
              className={cn(
                'inline-flex items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3.5 text-[14px] font-medium text-foreground hover:bg-white hover:shadow-sm dark:bg-transparent dark:hover:bg-surface-raised',
                interactivePressSolidClass
              )}
            >
              {t('nav.signIn')}
            </Link>
            <Link
              href="#pricing"
              className={cn(
                'inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[14px] font-medium text-muted hover:text-foreground',
                interactivePressSolidClass
              )}
            >
              {t('landing.hero.ctaPricing')}
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">{t('landing.hero.footnote')}</p>
        </div>

        <LandingProductPreview />
      </div>
    </section>
  )
}
