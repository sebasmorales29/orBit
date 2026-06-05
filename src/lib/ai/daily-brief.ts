import type { TodayAction } from '@/types/database'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { BusinessVertical } from '@/lib/business-context/types'

export type DailyBriefInput = {
  vertical: BusinessVertical
  profile: OnboardingProfile | null
  stats: {
    activeLeads: number
    openOrders: number
    revenueMonth: number
    profitMonth: number
    marginPercent: number | null
    pendingCollect: number
  }
  actions: TodayAction[]
  lowStockCount: number
  hasCostData: boolean
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function generateDailyBrief(input: DailyBriefInput, t: TranslateFn): string[] {
  const bullets: string[] = []
  const { stats, actions, lowStockCount, hasCostData } = input

  if (actions.length > 0) {
    const high = actions.filter((a) => a.urgency === 'high').length
    bullets.push(
      t('app.ai.brief.priorities', { count: actions.length, high: high })
    )
  } else {
    bullets.push(t('app.ai.brief.calm'))
  }

  if (stats.pendingCollect > 0) {
    bullets.push(t('app.ai.brief.collect', { amount: Math.round(stats.pendingCollect) }))
  }

  if (stats.revenueMonth > 0) {
    if (hasCostData && stats.profitMonth > 0) {
      bullets.push(
        t('app.ai.brief.profit', {
          profit: Math.round(stats.profitMonth),
          margin: stats.marginPercent ?? 0,
        })
      )
    } else {
      bullets.push(t('app.ai.brief.revenue', { revenue: Math.round(stats.revenueMonth) }))
      if (!hasCostData) bullets.push(t('app.ai.brief.addCosts'))
    }
  }

  if (stats.activeLeads > 0) {
    bullets.push(t('app.ai.brief.inquiries', { count: stats.activeLeads }))
  }

  if (lowStockCount > 0) {
    bullets.push(t('app.ai.brief.stock', { count: lowStockCount }))
  }

  const vertical = input.vertical
  if (vertical === 'barber' && stats.openOrders > 0) {
    bullets.push(t('app.ai.brief.barber'))
  }
  if (vertical === 'food' && stats.openOrders > 0) {
    bullets.push(t('app.ai.brief.food'))
  }
  if (input.profile?.successFocus === 'sales' && stats.activeLeads > 0) {
    bullets.push(t('app.ai.brief.focusSales'))
  }

  return bullets.slice(0, 5)
}
