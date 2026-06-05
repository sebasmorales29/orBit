'use client'

import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'
import { landingContainerClass } from '@/components/landing/landing-layout'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export function LandingFooter() {
  const { t } = useTranslations()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border-subtle py-10">
      <div className={`${landingContainerClass} flex flex-col gap-8`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14px] font-medium text-foreground">{BRAND_NAME}</p>
            <p className="mt-1 text-[13px] text-muted">{t('landing.footer.tagline')}</p>
          </div>
          <a
            href={`mailto:${t('landing.footer.contact')}`}
            className="text-[13px] text-muted transition-colors hover:text-foreground"
          >
            {t('landing.footer.contact')}
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="#features" className="text-[13px] text-muted hover:text-foreground">
            {t('nav.product')}
          </a>
          <a href="#pricing" className="text-[13px] text-muted hover:text-foreground">
            {t('nav.pricing')}
          </a>
          <a href="#faq" className="text-[13px] text-muted hover:text-foreground">
            {t('nav.faq')}
          </a>
          <a href="#contacto" className="text-[13px] text-muted hover:text-foreground">
            {t('nav.requestDemo')}
          </a>
          <Link href="/terminos" className="text-[13px] text-muted hover:text-foreground">
            {t('auth.signup.termsLink')}
          </Link>
          <Link href="/privacidad" className="text-[13px] text-muted hover:text-foreground">
            {t('auth.signup.privacyLink')}
          </Link>
        </nav>
        <p className="text-[12px] text-muted-foreground">
          © {year} {BRAND_NAME}
        </p>
      </div>
    </footer>
  )
}
