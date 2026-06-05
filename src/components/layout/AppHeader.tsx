'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, Settings } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { appShellClass } from '@/components/layout/app-layout'
import { AppHeaderMenu } from '@/components/layout/AppHeaderMenu'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { TenantNavDropdown } from '@/components/layout/TenantNavDropdown'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { transitionColors } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  /** Contenido extra junto al menú ⋯ (p. ej. acciones puntuales) */
  actionsBeforeMenu?: React.ReactNode
  /** Solo en /hoy: abre personalizar panel desde el menú */
  onCustomize?: () => void
}

export function AppHeader({
  title,
  subtitle,
  backHref,
  actionsBeforeMenu,
  onCustomize,
}: AppHeaderProps) {
  const pathname = usePathname()
  const { t } = useTranslations()
  const showBack = Boolean(backHref)
  const onSettings = pathname.startsWith('/ajustes')

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
      <div className={cn(appShellClass, 'flex items-center justify-between gap-3 py-4')}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBack && (
            <Link
              href={backHref ?? '..'}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Volver"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          <div
            className={cn(
              'grid min-w-0 flex-1 gap-x-2.5',
              subtitle ? 'grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] gap-y-0.5' : 'grid-cols-[auto_minmax(0,1fr)]'
            )}
          >
            <BrandLogo
              href="/hoy"
              size={40}
              className={cn('shrink-0 self-center', subtitle && 'row-span-2')}
            />
            <h1 className="min-w-0 self-center truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="min-w-0 truncate text-[12px] text-muted">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex h-10 shrink-0 items-center gap-2">
          <TenantNavDropdown />
          <AppHeaderMenu actionsBeforeMenu={actionsBeforeMenu} onCustomize={onCustomize} />
          <Link
            href="/ajustes"
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              transitionColors,
              onSettings
                ? 'bg-surface-hover text-foreground'
                : 'text-muted hover:bg-surface-hover hover:text-foreground'
            )}
            aria-label={t('app.settings.title')}
            aria-current={onSettings ? 'page' : undefined}
          >
            <Settings className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </Link>
          <ChromeControls className="h-10 shadow-none" />
        </div>
      </div>
    </header>
  )
}
