'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export default function OnboardingExitoPage() {
  const router = useRouter()
  const { t } = useTranslations()

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      router.push('/hoy?welcome=1')
      router.refresh()
    }, 8000)
    return () => window.clearTimeout(tmr)
  }, [router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md rounded-3xl border border-border-subtle bg-surface-raised p-8 shadow-lg">
        <PartyPopper className="mx-auto h-12 w-12 text-accent" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {t('onboarding.successPageTitle')}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {t('onboarding.successPageBody')}
        </p>
        <p className="mt-4 text-[13px] font-medium text-foreground">
          {t('onboarding.successPageVip')}
        </p>
        <Button className="mt-8 w-full" onClick={() => router.push('/hoy?welcome=1')}>
          {t('onboarding.successPageCta')}
        </Button>
      </div>
    </div>
  )
}
