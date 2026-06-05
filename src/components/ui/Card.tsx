import { cn } from '@/lib/utils'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border-subtle bg-white p-4 shadow-sm dark:border-border dark:bg-surface-card dark:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
