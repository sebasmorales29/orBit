'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { buildWelcomeBannerMessage } from '@/lib/onboarding/personalization'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export function HoyWelcomeBanner({
  orgName,
  profile,
}: {
  orgName: string
  profile: OnboardingProfile | null
}) {
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setVisible(true)
    }
  }, [searchParams])

  if (!visible) return null

  const { title, body } = buildWelcomeBannerMessage(profile, orgName, t)

  return (
    <div className="relative rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 pr-10">
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{body}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-hover"
        aria-label={t('app.dashboard.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
