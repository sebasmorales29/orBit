'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  LayoutGrid,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plug,
  Settings,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

type MenuLink = {
  href: string
  label: string
  icon: typeof Users
}

interface AppHeaderMenuProps {
  actionsBeforeMenu?: React.ReactNode
  onCustomize?: () => void
}

export function AppHeaderMenu({ actionsBeforeMenu, onCustomize }: AppHeaderMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslations()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const links: MenuLink[] = [
    { href: '/clientes', label: t('app.more.clients'), icon: Users },
    { href: '/metricas', label: t('app.more.metrics'), icon: BarChart3 },
    { href: '/plantillas', label: t('app.more.templates'), icon: FileText },
    { href: '/integraciones', label: t('app.more.integrations'), icon: Plug },
    { href: '/consultas', label: t('app.more.inquiries'), icon: MessageCircle },
    { href: '/ajustes', label: t('app.more.settings'), icon: Settings },
  ]

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const showCustomize = pathname.startsWith('/hoy') && Boolean(onCustomize)

  return (
    <div ref={rootRef} className="relative flex shrink-0 items-center">
      {actionsBeforeMenu}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          open
            ? 'bg-surface-hover text-foreground'
            : 'text-muted hover:bg-surface-hover hover:text-foreground'
        )}
        aria-label={t('app.header.menu')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-lg"
        >
          {showCustomize && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onCustomize?.()
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-surface-raised"
              >
                <LayoutGrid className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
                {t('app.dashboard.customize')}
              </button>
              <div className="my-1 border-t border-border-subtle" />
            </>
          )}

          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-surface-raised',
                pathname.startsWith(href) ? 'font-medium text-foreground' : 'text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
              {label}
            </Link>
          ))}

          <div className="my-1 border-t border-border-subtle" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-destructive transition-colors hover:bg-surface-raised"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {t('app.header.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
