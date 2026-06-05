'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AuthNetworkScene } from '@/components/auth/AuthNetworkScene'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import type { AuthFocusField } from '@/components/auth/auth-scene'

interface AuthSplitLayoutProps {
  children: React.ReactNode
  focusField: AuthFocusField
  passwordVisible: boolean
}

export function AuthSplitLayout({ children, focusField, passwordVisible }: AuthSplitLayoutProps) {
  const { t } = useTranslations()

  return (
    <div className="flex min-h-dvh w-full justify-center overflow-y-auto overflow-x-hidden bg-surface px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/"
        className="fixed left-4 top-4 z-30 inline-flex items-center gap-1 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-[13px] font-medium text-muted shadow-sm backdrop-blur-md transition-colors hover:bg-surface-hover hover:text-foreground sm:left-6 sm:top-6"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {t('auth.backHome')}
      </Link>

      <ChromeControls className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" />

      <div className="my-auto w-full max-w-[960px] shrink-0 rounded-[28px] border border-border bg-surface-raised shadow-[0_32px_64px_-24px_rgb(0_0_0/0.45)]">
        <div className="flex flex-col overflow-hidden rounded-[27px] lg:max-h-[min(640px,calc(100dvh-4rem))] lg:min-h-[560px] lg:flex-row">
          <div className="relative min-h-[220px] shrink-0 overflow-hidden bg-surface-card lg:min-h-0 lg:w-[52%]">
            <div className="relative flex h-full min-h-[220px] items-center px-4 py-6 lg:min-h-[560px] lg:px-6">
              <AuthNetworkScene focusField={focusField} passwordVisible={passwordVisible} />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-border bg-surface lg:max-h-[min(640px,calc(100dvh-4rem))] lg:overflow-y-auto lg:border-t-0 lg:border-l">
            <div className="px-8 py-8 sm:px-10 lg:px-12 lg:py-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
