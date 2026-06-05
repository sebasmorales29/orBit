import type { BillingCycle } from '@/lib/billing/types'

export function cycleMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly':
      return 1
    case 'semiannual':
      return 6
    case 'annual':
      return 12
  }
}

export function addBillingPeriod(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start)
  end.setMonth(end.getMonth() + cycleMonths(cycle))
  return end
}

export function formatBillingDate(iso: string | null | undefined, locale = 'es-CR'): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}
