'use client'

import { useTranslations } from '@/components/i18n/LocaleProvider'

export function LandingProductPreview() {
  const { t } = useTranslations()

  const rows = [
    {
      title: t('landing.preview.followLead'),
      meta: t('landing.preview.metaLead'),
      amount: '₡45,000',
    },
    {
      title: t('landing.preview.collectOrder'),
      meta: t('landing.preview.metaOrder'),
      amount: '₡28,000',
    },
    {
      title: t('landing.preview.restock'),
      meta: t('landing.preview.metaStock'),
      amount: null,
    },
  ]

  return (
    <div className="relative w-full lg:justify-self-end">
      <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-accent/[0.06] blur-3xl dark:bg-foreground/[0.03]" />
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_12px_40px_rgb(22_24_28/0.08)] ring-1 ring-border-subtle dark:border-border dark:bg-surface-raised dark:shadow-sm dark:ring-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('landing.preview.today')}
            </p>
            <p className="text-[14px] font-semibold text-foreground">Luna Skincare</p>
          </div>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium text-accent">
            {t('landing.preview.actions', { count: 3 })}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.title} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">{row.title}</p>
                <p className="text-[11px] text-muted">{row.meta}</p>
              </div>
              {row.amount && (
                <span className="shrink-0 text-[12px] font-medium text-foreground">
                  {row.amount}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
