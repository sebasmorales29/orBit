'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { useTranslations } from '@/components/i18n/LocaleProvider'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslations()

  return (
    <div className="flex min-h-dvh flex-col">
      <ChromeControls className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" />

      <header className="flex h-12 items-center justify-between px-6 pt-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {t('auth.backHome')}
        </Link>
        <BrandLogo
          href="/"
          size={44}
          sizeMd={48}
          className="absolute left-1/2 -translate-x-1/2"
        />
        <span className="w-[4.5rem]" aria-hidden />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-8 sm:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}
