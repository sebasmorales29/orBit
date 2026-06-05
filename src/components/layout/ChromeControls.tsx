'use client'

import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

interface ChromeControlsProps {
  className?: string
}

/** Controles de chrome: idioma + tema */
export function ChromeControls({ className }: ChromeControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LanguageToggle />
      <ThemeToggle />
    </div>
  )
}
