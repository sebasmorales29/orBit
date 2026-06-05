'use client'

import { transitionColors } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface OnboardingOptionProps {
  selected: boolean
  onClick: () => void
  title: string
  description?: string
  className?: string
}

export function OnboardingOption({
  selected,
  onClick,
  title,
  description,
  className,
}: OnboardingOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-4 py-3 text-left',
        transitionColors,
        selected
          ? 'border-accent/50 bg-accent-soft'
          : 'border-border bg-surface-raised hover:border-accent/25 hover:bg-surface-hover',
        className
      )}
    >
      <span
        className={cn(
          'block text-[13px] font-medium',
          selected ? 'text-accent' : 'text-foreground'
        )}
      >
        {title}
      </span>
      {description && (
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{description}</span>
      )}
    </button>
  )
}
