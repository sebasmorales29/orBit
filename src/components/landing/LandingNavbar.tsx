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
    const sectionIds: NavId[] = [
      ...navLinks.filter((l) => l.id !== 'top').map((l) => l.id),
      'contacto',
    ]

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

  const linkClass = (id: NavId, mobile = false) =>
    cn(
      'rounded-full font-medium',
      transitionColors,
      interactivePressClass,
      mobile ? 'block w-fit px-4 py-2.5 text-[14px]' : 'px-3.5 py-2 text-[14px] lg:px-4',
      activeId === id
        ? 'bg-surface-hover text-foreground'
        : 'text-muted hover:text-foreground'
    )

  const handleNavClick = (id: NavId) => {
    setMobileOpen(false)
    if (id === 'top') {
      scrollToTop()
      setActiveId('top')
    } else {
      setActiveId(id)
    }
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
        <div
          className={cn(
            landingContainerClass,
            'pointer-events-auto rounded-3xl border-0 bg-white/90 shadow-[0_8px_30px_rgb(22_24_28/0.06)] ring-0 outline-none backdrop-blur-md dark:border-0 dark:bg-black dark:shadow-none dark:ring-0 dark:backdrop-blur-none'
          )}
        >
          <div
            className={cn(
              'flex h-16 items-center gap-4 px-1 sm:gap-6 sm:px-2 md:grid md:h-[4.5rem] md:grid-cols-[1fr_auto_1fr] md:items-center md:px-3'
            )}
          >
          <div className="flex h-12 shrink-0 items-center md:h-16 md:justify-self-start">
            <BrandLogo
              href="/"
              size={52}
              sizeMd={64}
              priority
              onClick={() => {
                setMobileOpen(false)
                setActiveId('top')
              }}
            />
          </div>

          <nav
            className="hidden items-center justify-center gap-0.5 md:flex"
            aria-label={t('nav.mobileNav')}
          >
            {navLinks.map((link) =>
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
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 md:justify-self-end">
            {adminSlot}
            <Link
              href="/login"
              className={cn(
                'hidden rounded-full px-3 py-1.5 text-[13px] font-medium leading-none text-muted hover:text-foreground sm:inline-flex sm:px-3.5',
                transitionColors,
                interactivePressClass
              )}
            >
              {t('nav.signIn')}
            </Link>
            <Link
              href="/signup"
              className={cn(
                'hidden rounded-full border border-border bg-surface-raised px-3 py-1.5 text-[13px] font-medium leading-none text-foreground hover:bg-surface-hover sm:inline-flex',
                transitionColors,
                interactivePressClass
              )}
            >
              {t('nav.getStarted')}
            </Link>
            <a
              href="#contacto"
              onClick={() => {
                setMobileOpen(false)
                setActiveId('contacto')
              }}
              className={cn(
                'hidden rounded-full bg-foreground px-3 py-1.5 text-[13px] font-medium leading-none text-surface hover:opacity-95 sm:inline-flex',
                interactivePressSolidClass
              )}
            >
              {t('nav.requestDemo')}
            </a>

            <ChromeControls className="hidden shadow-none sm:flex" />

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? t('common.closeMenu') : t('common.openMenu')}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] md:hidden',
          transitionFade,
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <div
        className={cn(
          'fixed top-[5.25rem] z-50 sm:top-[5.75rem] md:hidden',
          transitionReveal,
          landingContainerClass,
          mobileOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
        )}
      >
        <div className="rounded-3xl border border-border bg-white p-5 shadow-lg dark:bg-surface">
          <nav className="flex flex-col gap-1" aria-label={t('nav.mobileNav')}>
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
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
            {adminSlot && <div className="flex justify-start px-4">{adminSlot}</div>}
            <div className="flex justify-start">
              <ChromeControls />
            </div>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="rounded-full bg-foreground py-2 text-center text-[13px] font-medium leading-none text-surface"
            >
              {t('nav.getStarted')}
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-border py-2 text-center text-[13px] font-medium leading-none text-foreground"
            >
              {t('nav.signIn')}
            </Link>
            <a
              href="#contacto"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-border py-2 text-center text-[13px] font-medium leading-none text-muted"
            >
              {t('nav.requestDemo')}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
