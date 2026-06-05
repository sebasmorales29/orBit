import { cn } from '@/lib/utils'

type AccountStatus = 'active' | 'suspended'

const STYLES: Record<AccountStatus, string> = {
  active: 'bg-emerald-500',
  suspended: 'bg-orange-500',
}

const LABELS: Record<AccountStatus, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
}

export function AccountStatusDot({
  status,
  className,
}: {
  status: AccountStatus
  className?: string
}) {
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', STYLES[status], className)}
      title={LABELS[status]}
      aria-label={LABELS[status]}
    />
  )
}

export function isAuthUserSuspended(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false
  return new Date(bannedUntil).getTime() > Date.now()
}
