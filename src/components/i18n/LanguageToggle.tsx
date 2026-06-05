'use client'

import { cn } from '@/lib/utils'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { Locale } from '@/i18n'

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLocale()

  const options = [
    { id: 'es' as const, label: t('chrome.languageEs'), ariaLabel: t('chrome.switchToEs') },
    { id: 'en' as const, label: t('chrome.languageEn'), ariaLabel: t('chrome.switchToEn') },
  ]

  return (
    <SegmentedControl<Locale>
      value={locale}
      onChange={setLocale}
      options={options}
      size="sm"
      shape="pill"
      thumbVariant="accent"
      ariaLabel="Language"
      className={cn('border-0 bg-transparent shadow-none dark:bg-transparent', className)}
    />
  )
}
