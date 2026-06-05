'use client'

import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export function AjustesShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslations()

  return (
    <>
      <AppHeader title={t('app.settings.title')} backHref="/hoy" />
      {children}
    </>
  )
}
