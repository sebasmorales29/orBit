'use client'

import { AppHeader } from '@/components/layout/AppHeader'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { adaptLabel } from '@/lib/business-context/labels'
import { useTranslations } from '@/components/i18n/LocaleProvider'

interface VentasPageClientProps {
  openCount: number
  openOnly: boolean
}

export function VentasPageClient({ openCount, openOnly }: VentasPageClientProps) {
  const { t } = useTranslations()
  const adaptation = useBusinessAdaptation()
  const title = adaptLabel(adaptation.labelScope, 'navSales', t)
  const subtitle =
    openCount > 0
      ? openOnly
        ? t('app.sales.subtitleOpen', { count: openCount })
        : t('app.sales.subtitleTotal', { count: openCount })
      : undefined

  return <AppHeader title={title} subtitle={subtitle} />
}
