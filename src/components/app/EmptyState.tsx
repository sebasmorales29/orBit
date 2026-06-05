import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({ title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border bg-surface-raised/50 px-6 py-14 text-center',
        className
      )}
    >
      <p className="text-[15px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
