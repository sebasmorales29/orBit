'use client'

import { useTranslations } from '@/components/i18n/LocaleProvider'
import {
  interactivePressClass,
  interactivePressPrimaryClass,
} from '@/lib/motion'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: cn('bg-accent text-on-accent hover:brightness-105', interactivePressPrimaryClass),
  secondary: cn(
    'border border-border bg-surface text-foreground hover:bg-surface-hover hover:shadow-sm dark:bg-surface-card',
    interactivePressClass
  ),
  ghost: cn(
    'bg-transparent text-muted hover:bg-surface-hover hover:text-foreground',
    interactivePressClass
  ),
  accent: cn(
    'border border-accent/45 bg-transparent text-accent hover:bg-accent-soft hover:border-accent/60',
    interactivePressClass
  ),
  danger: cn(
    'border border-red-300/50 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400',
    interactivePressClass
  ),
}

export function Button({
  className,
  variant = 'primary',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const { t } = useTranslations()

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? t('common.loading') : children}
    </button>
  )
}
