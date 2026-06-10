'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import {
  interactivePressClass,
  interactivePressSolidClass,
  transitionColors,
  transitionFade,
  transitionReveal,
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeId, setActiveId] = useState<NavId>('top')

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
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

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

  const navPillBase = (drawer = false) =>
    cn(
      'rounded-full font-medium whitespace-nowrap',
      transitionColors,
      interactivePressClass,
      drawer
        ? 'flex w-full items-center px-4 py-3 text-[15px]'
        : 'inline-flex shrink-0 items-center px-3 py-1.5 text-[12px] sm:px-3.5 sm:py-2 sm:text-[13px]'
    )

  const linkClass = (id: NavId, drawer = false) =>
    cn(
      navPillBase(drawer),
      drawer &&
        (activeId === id
          ? 'bg-surface-hover font-semibold text-foreground'
          : 'text-muted hover:bg-surface-hover hover:text-foreground')
    )

  const closeDrawer = () => setDrawerOpen(false)

  const handleNavClick = (id: NavId) => {
    closeDrawer()
    if (id === 'top') {
      scrollToTop()
      setActiveId('top')
    } else {
      setActiveId(id)
    }
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <div
          className={cn(
            landingContainerClass,
            'pointer-events-auto rounded-2xl border border-border-subtle bg-surface/95 shadow-[0_8px_30px_rgb(22_24_28/0.06)] ring-0 outline-none backdrop-blur-md dark:border-border dark:shadow-none sm:rounded-3xl'
          )}
        >
          <div className="flex h-14 items-center gap-2 px-2 sm:h-16 sm:gap-3 sm:px-3">
            {/* Izquierda: menú + logo */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen((o) => !o)}
                aria-expanded={drawerOpen}
                aria-controls="landing-side-menu"
                aria-label={drawerOpen ? t('common.closeMenu') : t('common.openMenu')}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-surface-hover sm:h-10 sm:w-10',
                  transitionColors,
                  interactivePressClass
                )}
              >
                {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <BrandLogo
                href="/"
                size={36}
                sizeMd={48}
                priority
                onClick={() => {
                  closeDrawer()
                  setActiveId('top')
                }}
              />
            </div>

            {/* Derecha: idioma, tema, entrar, demo */}
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
              {adminSlot}
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

      {/* Drawer lateral */}
      <div
        className={cn(
          'fixed inset-0 z-[60]',
          transitionFade,
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          className={cn(
            'bg-scrim absolute inset-0',
            transitionFade,
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeDrawer}
        />

        <aside
          id="landing-side-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobileNav')}
          className={cn(
            'absolute inset-y-0 left-0 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-border bg-surface-raised text-foreground shadow-2xl sm:w-72',
            transitionReveal,
            drawerOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <BrandLogo href="/" size={32} onClick={() => handleNavClick('top')} />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface-hover"
              onClick={closeDrawer}
              aria-label={t('common.closeMenu')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4" aria-label={t('nav.mobileNav')}>
            {navLinks.map((link) =>
              link.id === 'top' ? (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick('top')}
                  className={linkClass('top', true)}
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => handleNavClick(link.id)}
                  className={linkClass(link.id, true)}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {adminSlot && (
            <div className="border-t border-border px-4 py-4">{adminSlot}</div>
          )}
        </aside>
      </div>
    </>
  )
}
