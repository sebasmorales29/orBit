import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SuperAdminPlatformLinkProps {
  href: string
  label: string
  className?: string
  variant?: 'pill' | 'text'
}

/** Enlace visible solo cuando el servidor ya validó super admin */
export function SuperAdminPlatformLink({
  href,
  label,
  className,
  variant = 'pill',
}: SuperAdminPlatformLinkProps) {
  if (variant === 'text') {
    return (
      <Link
        href={href}
        className={cn(
          'text-[13px] text-muted transition-colors hover:text-foreground',
          className
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-surface/90 px-3 py-1.5 text-[12px] font-medium text-muted shadow-sm backdrop-blur-md transition-colors hover:border-border hover:bg-surface-raised hover:text-foreground',
        className
      )}
    >
      {label}
    </Link>
  )
}
