'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { getMessages } from '@/i18n'

interface LegalDocumentProps {
  kind: 'terms' | 'privacy'
}

export function LegalDocument({ kind }: LegalDocumentProps) {
  const { t, locale } = useTranslations()
  const doc = getMessages(locale).legal[kind]

  return (
    <div className="min-h-dvh">
      <ChromeControls className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" />

      <header className="border-b border-border bg-surface-raised/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {t('legal.back')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 sm:px-8 sm:py-14">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {doc.title}
        </h1>
        <p className="mt-2 text-[13px] text-muted">{doc.updated}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-[15px] font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-border pt-8 text-[12px] leading-relaxed text-muted-foreground">
          {t('legal.contact')}
        </p>
      </main>
    </div>
  )
}
