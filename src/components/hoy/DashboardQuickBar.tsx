'use client'

import Link from 'next/link'
import { Plus, ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { useAppOrg } from '@/components/app/AppOrgProvider'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { adaptQuickLabel } from '@/lib/business-context/labels'
import type { QuickActionId } from '@/lib/business-context/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const ACTION_META: Record<
  QuickActionId,
  { href: string; icon: typeof Plus; i18nKey: string }
> = {
  newLead: { href: '/consultas', icon: Plus, i18nKey: 'newLead' },
  newOrder: { href: '/ventas', icon: ShoppingBag, i18nKey: 'newOrder' },
  sales: { href: '/ventas', icon: TrendingUp, i18nKey: 'sales' },
  stock: { href: '/stock', icon: Package, i18nKey: 'stock' },
}

export function DashboardQuickBar() {
  const { t } = useTranslations()
  const org = useAppOrg()
  const adaptation = useBusinessAdaptation()
  const usesStock = org?.uses_stock !== false

  const visible = adaptation.quickActions.filter(
    (id) => id !== 'stock' || usesStock
  )

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((id) => {
        const meta = ACTION_META[id]
        const Icon = meta.icon
        const isPrimary = id === adaptation.primaryQuickAction
        return (
          <Link
            key={id}
            href={meta.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors',
              isPrimary
                ? 'border-accent/40 bg-accent text-on-accent hover:opacity-90'
                : 'border-border bg-surface-raised text-foreground hover:border-accent/30 hover:bg-surface-hover'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={isPrimary ? 2 : 1.5} />
            {adaptQuickLabel(adaptation.labelScope, meta.i18nKey, t)}
          </Link>
        )
      })}
    </div>
  )
}
