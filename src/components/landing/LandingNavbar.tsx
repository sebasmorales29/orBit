'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import {
  interactivePressClass,
  interactivePressSolidClass,
  transitionColors,
  transitionIcon,
} from '@/lib/motion'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { landingContainerClass } from '@/components/landing/landing-layout'
import { useTranslations } from '@/components/i18n/LocaleProvider'

type NavId = 'top' | 'features' | 'pricing' | 'faq' | 'contacto'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

interface LandingNavbarProps {
  adminSlot?: React.ReactNode
}

export function LandingNavbar({ adminSlot }: LandingNavbarProps) {
  const { t } = useTranslations()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<NavId>('top')
  const menuRef = useRef<HTMLDivElement>(null)

  const navLinks = useMemo(
    () =>
      [
        { id: 'top' as const, href: '#', label: t('nav.home') },
        { id: 'features' as const, href: '#features', label: t('nav.product') },
        { id: 'pricing' as const, href: '#pricing', label: t('nav.pricing') },
        { id: 'faq' as const, href: '#faq', label: t('nav.faq') },
        { id: 'contacto' as const, href: '#contacto', label: t('nav.contact') },
      ],
    [t]
  )

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [menuOpen])

  useEffect(() => {
    const sectionIds: NavId[] = navLinks.filter((l) => l.id !== 'top').map((l) => l.id)

    const onScroll = () => {
      if (window.scrollY < 80) {
        setActiveId('top')
        return
      }
      const offset = window.innerHeight * 0.35
      let current: NavId = 'top'
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset) {
          current = id
        }
      }
      setActiveId(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [navLinks])

  const navPillBase = () =>
    cn(
      'inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap sm:px-3.5 sm:py-2 sm:text-[13px]',
      transitionColors,
      interactivePressClass
    )

  const closeMenu = () => setMenuOpen(false)

  const handleNavClick = (id: NavId) => {
    closeMenu()
    if (id === 'top') {
      scrollToTop()
      setActiveId('top')
    } else {
      setActiveId(id)
    }
  }

  const menuItemClass = (id: NavId) =>
    cn(
      'group relative flex w-full items-center gap-2 rounded-xl border-l-2 py-2.5 pr-3 pl-2.5 text-left text-[14px] font-medium transition-[background-color,color,border-color] duration-200',
      activeId === id
        ? 'border-accent bg-accent-soft text-foreground'
        : 'border-transparent text-muted hover:border-border hover:bg-surface-hover hover:text-foreground'
    )

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        className={cn(
          landingContainerClass,
          'pointer-events-auto overflow-visible rounded-2xl border border-border-subtle bg-surface/95 shadow-[0_8px_30px_rgb(22_24_28/0.06)] ring-0 outline-none backdrop-blur-md dark:border-border dark:shadow-none sm:rounded-3xl'
        )}
      >
        <div className="flex h-14 items-center gap-2 overflow-visible px-2 sm:h-16 sm:gap-3 sm:px-3">
          <div className="flex shrink-0 items-center gap-1 overflow-visible sm:gap-2">
            {/* Menú anclado al hamburguesa */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-controls="landing-nav-menu"
                aria-haspopup="menu"
                aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground sm:h-10 sm:w-10',
                  menuOpen ? 'bg-surface-hover' : 'hover:bg-surface-hover',
                  transitionColors,
                  interactivePressClass
                )}
              >
                <Menu
                  className={cn(
                    'absolute h-5 w-5',
                    transitionIcon,
                    menuOpen ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                  )}
                />
                <X
                  className={cn(
                    'absolute h-5 w-5',
                    transitionIcon,
                    menuOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  )}
                />
              </button>

              {menuOpen && (
                <div
                  id="landing-nav-menu"
                  role="menu"
                  aria-label={t('nav.mobileNav')}
                  className="nav-menu-panel absolute top-[calc(100%+0.5rem)] -left-3 z-[70] min-w-[14rem] sm:-left-4"
                >
                  {/* Caret hacia el botón */}
                  <div
                    className="absolute -top-1.5 left-[1.625rem] h-3 w-3 rotate-45 border-t border-l border-border bg-surface-raised"
                    aria-hidden
                  />

                  <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-[0_16px_48px_rgb(22_24_28/0.14)] ring-1 ring-accent/15 dark:shadow-[0_20px_50px_rgb(0_0_0/0.45)]">
                    {/* Acento superior */}
                    <div
                      className="h-[3px] w-full bg-gradient-to-r from-accent via-accent/60 to-transparent"
                      aria-hidden
                    />

                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        {t('nav.mobileNav')}
                      </p>
                    </div>

                    <nav className="flex flex-col gap-0.5 px-2 pb-2">
                      {navLinks.map((link, index) => {
                        const style = { animationDelay: `${60 + index * 45}ms` }

                        return link.id === 'top' ? (
                          <button
                            key={link.id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleNavClick('top')}
                            className={cn(menuItemClass('top'), 'nav-menu-item')}
                            style={style}
                          >
                            <span className="flex-1">{link.label}</span>
                            {activeId === link.id && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                            )}
                          </button>
                        ) : (
                          <a
                            key={link.id}
                            href={link.href}
                            role="menuitem"
                            onClick={() => handleNavClick(link.id)}
                            className={cn(menuItemClass(link.id), 'nav-menu-item')}
                            style={style}
                          >
                            <span className="flex-1">{link.label}</span>
                            {activeId === link.id && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                            )}
                          </a>
                        )
                      })}
                    </nav>

                    {adminSlot && (
                      <div className="border-t border-border px-3 py-3">{adminSlot}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <BrandLogo
              href="/"
              size={36}
              sizeMd={48}
              priority
              onClick={() => {
                closeMenu()
                setActiveId('top')
              }}
            />
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
            <ChromeControls className="shadow-none" />
            <Link
              href="/login"
              className={cn(navPillBase(), 'text-muted hover:text-foreground')}
            >
              {t('nav.signIn')}
            </Link>
            <a
              href="#contacto"
              onClick={() => setActiveId('contacto')}
              className={cn(
                navPillBase(),
                'bg-foreground text-surface hover:opacity-95',
                interactivePressSolidClass
              )}
            >
              {t('nav.requestDemo')}
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
