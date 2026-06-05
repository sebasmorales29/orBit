'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

function isActive(pathname: string, href: string) {
  if (href === '/ops') return pathname === '/ops'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function OpsNav({
  isSuper,
  publicHref,
}: {
  isSuper: boolean
  publicHref?: string | null
}) {
  const pathname = usePathname()

  const linkClass = (href: string) =>
    cn(
      'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
      isActive(pathname, href)
        ? 'bg-surface-raised text-foreground'
        : 'text-muted hover:bg-surface-hover hover:text-foreground'
    )

  const iconClass = (href: string) =>
    cn(
      'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
      isActive(pathname, href)
        ? 'bg-surface-raised text-foreground'
        : 'text-muted hover:bg-surface-hover hover:text-foreground'
    )

  return (
    <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Link href="/ops" className={linkClass('/ops')}>
        Home
      </Link>
      <Link href="/ops/inquiries" className={linkClass('/ops/inquiries')}>
        Contactos
      </Link>
      <Link href="/ops/tenants" className={linkClass('/ops/tenants')}>
        Tenants
      </Link>
      <Link href="/ops/users" className={linkClass('/ops/users')}>
        Usuarios
      </Link>
      {isSuper && (
        <Link href="/ops/access" className={linkClass('/ops/access')}>
          Acceso
        </Link>
      )}
      {isSuper && (
        <Link href="/ops/settings" className={iconClass('/ops/settings')} aria-label="Settings">
          <Settings className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
        </Link>
      )}
      <Link
        href="/ops/logout"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground'
        )}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
      </Link>
    </nav>
  )
}

