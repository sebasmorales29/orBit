'use client'

import { useMemo } from 'react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useTheme } from '@/components/theme/ThemeProvider'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import type { Theme } from '@/components/theme/theme'

export function ThemeSelect() {
  const { t } = useTranslations()
  const { theme, setTheme } = useTheme()

  const options = useMemo(
    (): { id: Theme; label: string }[] => [
      { id: 'light', label: t('theme.light') },
      { id: 'dark', label: t('theme.dark') },
      { id: 'system', label: t('theme.system') },
    ],
    [t]
  )

  return (
    <SegmentedControl<Theme>
      value={theme}
      onChange={setTheme}
      options={options}
      shape="rounded"
      size="md"
      fullWidth
      thumbVariant="accent"
      className="w-full border-border shadow-sm dark:border-border"
    />
  )
}
