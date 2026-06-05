'use client'

import Link from 'next/link'
import { Plus, ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { useAppOrg } from '@/components/app/AppOrgProvider'
import { cn } from '@/lib/utils'

const actions = [
  { href: '/ventas', icon: TrendingUp, key: 'newLead' as const },
  { href: '/pedidos', icon: ShoppingBag, key: 'newOrder' as const },
  { href: '/stock', icon: Package, key: 'stock' as const, requiresStock: true },
]

export function HoyQuickActions() {
  const { t } = useTranslations()
  const org = useAppOrg()

  const visible = actions.filter((a) => !a.requiresStock || org?.uses_stock !== false)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-3 lg:gap-3 xl:flex xl:flex-row">
      {visible.map(({ href, icon: Icon, key }) => (
        <Link
          key={key}
          href={href}
          className={cn(
            'flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-raised px-3 py-4',
            'transition-colors hover:border-accent/30 hover:bg-surface-hover',
            'xl:min-w-0 xl:flex-1 xl:px-4 xl:py-5'
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            {key === 'newLead' ? (
              <Plus className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            )}
          </span>
          <span className="text-center text-[11px] font-medium leading-tight text-foreground">
            {t(`app.hoy.quick.${key}`)}
          </span>
        </Link>
      ))}
    </div>
  )
}
