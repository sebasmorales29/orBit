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
  /** Solo el super admin recibe este slot desde el servidor */
  adminSlot?: React.ReactNode
}

export function LandingNavbar({ adminSlot }: LandingNavbarProps) {
  const { t } = useTranslations()
  const [mobileOpen, setMobileOpen] = useState(false)
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
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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

  const navPillBase = (mobile = false) =>
    cn(
      'rounded-full font-medium whitespace-nowrap',
      transitionColors,
      interactivePressClass,
      mobile
        ? 'flex w-full items-center justify-center px-4 py-3 text-[15px]'
        : 'inline-flex shrink-0 items-center px-3 py-2 text-[13px] xl:px-3.5 xl:text-[14px]'
    )

  const linkClass = (id: NavId, mobile = false) =>
    cn(
      navPillBase(mobile),
      activeId === id
        ? 'bg-surface-hover text-foreground'
        : 'text-muted hover:text-foreground'
    )

  const closeMobile = () => setMobileOpen(false)

  const handleNavClick = (id: NavId) => {
    closeMobile()
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
            'pointer-events-auto rounded-2xl border-0 bg-white/90 shadow-[0_8px_30px_rgb(22_24_28/0.06)] ring-0 outline-none backdrop-blur-md dark:border-0 dark:bg-black dark:shadow-none dark:ring-0 dark:backdrop-blur-none sm:rounded-3xl'
          )}
        >
          <div className="relative flex h-14 items-center px-2 sm:h-16 sm:px-3 xl:h-[4.5rem]">
            {/* Izquierda: logo */}
            <div className="relative z-10 shrink-0">
              <BrandLogo
                href="/"
                size={40}
                sizeMd={52}
                priority
                onClick={() => {
                  closeMobile()
                  setActiveId('top')
                }}
              />
            </div>

            {/* Centro: links (absoluto, no compite con CTAs) */}
            <nav
              className="pointer-events-none absolute inset-x-0 hidden items-center justify-center xl:flex"
              aria-label={t('nav.mobileNav')}
            >
              <div className="pointer-events-auto flex items-center gap-0.5">
                {navLinks
                  .filter((link) => link.id !== 'contacto')
                  .map((link) =>
                    link.id === 'top' ? (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => handleNavClick('top')}
                        className={linkClass('top')}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        key={link.id}
                        href={link.href}
                        onClick={() => handleNavClick(link.id)}
                        className={linkClass(link.id)}
                      >
                        {link.label}
                      </a>
                    )
                  )}
              </div>
            </nav>

            {/* Derecha: CTAs desktop */}
            <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-0.5 xl:flex xl:gap-1">
              {adminSlot}
              <Link
                href="/login"
                className={cn(navPillBase(), 'text-muted hover:text-foreground')}
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/signup"
                className={cn(
                  navPillBase(),
                  'border border-border bg-surface-raised text-foreground hover:bg-surface-hover'
                )}
              >
                {t('nav.getStarted')}
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
              <ChromeControls className="shadow-none" />
            </div>

            {/* Móvil / tablet: hamburguesa */}
            <button
              type="button"
              className="relative z-10 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground xl:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-menu"
              aria-label={mobileOpen ? t('common.closeMenu') : t('common.openMenu')}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile: menú pantalla completa */}
      <div
        className={cn(
          'fixed inset-0 z-[60] xl:hidden',
          transitionFade,
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-foreground/20 backdrop-blur-sm',
            transitionFade,
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeMobile}
        />

        <div
          id="landing-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobileNav')}
          className={cn(
            'absolute inset-x-0 top-0 flex max-h-[100dvh] flex-col overflow-y-auto bg-white shadow-xl dark:bg-surface',
            transitionReveal,
            mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <BrandLogo href="/" size={36} onClick={() => handleNavClick('top')} />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground"
              onClick={closeMobile}
              aria-label={t('common.closeMenu')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4" aria-label={t('nav.mobileNav')}>
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

          <div className="mt-auto flex flex-col gap-3 border-t border-border px-4 py-5">
            {adminSlot && <div className="px-1">{adminSlot}</div>}
            <div className="flex justify-center px-1">
              <ChromeControls />
            </div>
            <a
              href="#contacto"
              onClick={() => {
                closeMobile()
                setActiveId('contacto')
              }}
              className={cn(
                navPillBase(true),
                'bg-foreground text-surface',
                interactivePressSolidClass
              )}
            >
              {t('nav.requestDemo')}
            </a>
            <Link
              href="/signup"
              onClick={closeMobile}
              className={cn(
                navPillBase(true),
                'border border-border bg-surface-raised text-foreground'
              )}
            >
              {t('nav.getStarted')}
            </Link>
            <Link
              href="/login"
              onClick={closeMobile}
              className={cn(navPillBase(true), 'text-muted')}
            >
              {t('nav.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
