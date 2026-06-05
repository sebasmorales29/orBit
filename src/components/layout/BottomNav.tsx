'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import { appShellClass } from '@/components/layout/app-layout'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { adaptLabel } from '@/lib/business-context/labels'
import type { AppNavId } from '@/lib/business-context/types'
import { interactivePressClass, transitionColors } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/components/i18n/LocaleProvider'

const NAV_META: Record<
  AppNavId,
  { href: string; icon: typeof CalendarDays; labelKey: string }
> = {
  hoy: { href: '/hoy', icon: CalendarDays, labelKey: 'navToday' },
  ventas: { href: '/ventas', icon: TrendingUp, labelKey: 'navSales' },
  pedidos: { href: '/ventas?view=open', icon: ShoppingBag, labelKey: 'navOrders' },
  stock: { href: '/stock', icon: Package, labelKey: 'navStock' },
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslations()
  const adaptation = useBusinessAdaptation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className={cn(appShellClass, 'flex items-center justify-around gap-1 py-2 sm:gap-2')}>
        {adaptation.navOrder.map((id) => {
          const meta = NAV_META[id]
          const Icon = meta.icon
          const active = pathname.startsWith(meta.href)
          return (
            <Link
              key={id}
              href={meta.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5',
                transitionColors,
                interactivePressClass,
                active ? 'text-foreground' : 'text-muted hover:text-foreground/70'
              )}
            >
              <Icon
                className={cn('h-5 w-5', active && 'text-accent')}
                strokeWidth={active ? 2 : 1.5}
              />
              <span className="text-[10px] font-medium">
                {adaptLabel(adaptation.labelScope, meta.labelKey, t)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
