'use client'

import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface ChromeControlsProps {
  className?: string
}

/** Toggle de tema estilo Apple — el idioma vive en Ajustes */
export function ChromeControls({ className }: ChromeControlsProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <ThemeToggle />
    </div>
  )
}
