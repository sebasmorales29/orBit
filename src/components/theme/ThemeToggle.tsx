'use client'

import { Moon, Sun } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useTheme } from '@/components/theme/ThemeProvider'
import { transitionThumb } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

const TRACK_W = 52
const THUMB = 28
const INSET = 2
const THUMB_TRAVEL = TRACK_W - THUMB - INSET * 2

/** Interruptor estilo Apple: sol (claro) ↔ luna (oscuro) con thumb deslizante */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslations()
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t('theme.lightMode') : t('theme.darkMode')}
      onClick={toggle}
      className={cn(
        'relative shrink-0 rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2',
        'motion-reduce:transition-none',
        className
      )}
      style={{ width: TRACK_W, height: 32 }}
    >
      {/* Pista única — sin capas que se recorten raro */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full border transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isDark
            ? 'border-white/12 bg-[#3a3a3c]'
            : 'border-black/[0.08] bg-[#e9e9eb]'
        )}
      />

      <Sun
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2',
          'left-[7px] transition-opacity duration-300',
          isDark
            ? 'text-amber-400 opacity-95'
            : 'text-amber-600 opacity-0'
        )}
        strokeWidth={2}
      />
      <Moon
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2',
          'right-[7px] transition-opacity duration-300',
          isDark
            ? 'text-[#3d4a7a] opacity-0'
            : 'text-[#1e2a4a] opacity-90'
        )}
        strokeWidth={2}
      />

      {/* Thumb — absolute para no romper el fondo de la pista */}
      <span
        aria-hidden
        className={cn(
          'absolute top-[2px] z-[2] rounded-full bg-white',
          'shadow-[0_1px_3px_rgb(0_0_0/0.28),0_0_0_0.5px_rgb(0_0_0/0.04)]',
          transitionThumb
        )}
        style={{
          width: THUMB,
          height: THUMB,
          left: INSET,
          transform: isDark ? `translateX(${THUMB_TRAVEL}px)` : 'translateX(0)',
        }}
      />
    </button>
  )
}
