'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { ChevronRight, BarChart3, FileText, Plug, Settings, Users } from 'lucide-react'

export default function MasPage() {
  const { t } = useTranslations()

  const links = [
    { href: '/integraciones', label: t('app.more.integrations'), icon: Plug },
    { href: '/clientes', label: t('app.more.clients'), icon: Users },
    { href: '/metricas', label: t('app.more.metrics'), icon: BarChart3 },
    { href: '/plantillas', label: t('app.more.templates'), icon: FileText },
    { href: '/ajustes', label: t('app.more.settings'), icon: Settings },
  ]

  return (
    <>
      <AppHeader title={t('app.nav.more')} />
      <AppMain>
        <nav className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:max-w-xl lg:max-w-none">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-surface-raised"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />
                <span className="text-[14px] font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </Link>
          ))}
        </nav>
      </AppMain>
    </>
  )
}
