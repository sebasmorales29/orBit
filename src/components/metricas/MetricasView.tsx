'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppMain } from '@/components/layout/AppMain'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/app/SectionLabel'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import type { WeekPoint } from '@/lib/metrics/finance'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { formatMoney, type CurrencyCode } from '@/types/database'

interface MetricasViewProps {
  currency: CurrencyCode
  periodLabel: string
  salesMonth: number
  inquiriesCount: number
  inquiriesActive: number
  revenueMonth: number
  profitMonth: number
  marginPercent: number | null
  hasCostData: boolean
  pendingPayments: number
  weekly: WeekPoint[]
}

export function MetricasView({
  currency,
  periodLabel,
  salesMonth,
  inquiriesCount,
  inquiriesActive,
  revenueMonth,
  profitMonth,
  marginPercent,
  hasCostData,
  pendingPayments,
  weekly,
}: MetricasViewProps) {
  const { t } = useTranslations()

  const stats = [
    { label: t('app.metrics.salesCount'), value: String(salesMonth) },
    { label: t('app.metrics.inquiries'), value: String(inquiriesCount) },
    { label: t('app.metrics.inquiriesActive'), value: String(inquiriesActive) },
    { label: t('app.metrics.revenue'), value: formatMoney(revenueMonth, currency) },
    { label: t('app.metrics.profit'), value: formatMoney(profitMonth, currency) },
    { label: t('app.metrics.pending'), value: formatMoney(pendingPayments, currency) },
  ]

  const chartPoints = weekly.map((w) => ({
    label: w.label,
    values: { revenue: w.revenue, profit: w.profit },
  }))

  return (
    <>
      <AppHeader title={t('app.metrics.title')} backHref="/hoy" />
      <AppMain className="space-y-6">
        <Suspense fallback={null}>
          <DateRangeFilter />
        </Suspense>
        <div>
          <SectionLabel>
            {t('app.metrics.periodSection', { period: periodLabel })}
          </SectionLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {stats.map((s) => (
              <Card key={s.label} className="flex items-center justify-between bg-surface py-4">
                <span className="text-[13px] text-muted">{s.label}</span>
                <span className="text-[15px] font-semibold text-foreground">{s.value}</span>
              </Card>
            ))}
          </div>
          {hasCostData && marginPercent != null && (
            <p className="mt-2 text-[12px] text-muted">
              {t('app.metrics.margin', { percent: marginPercent })}
            </p>
          )}
        </div>

        <Card className="bg-surface p-4 sm:p-5">
          <SectionLabel>{t('app.metrics.chartTitle')}</SectionLabel>
          <p className="mt-1 mb-4 text-[12px] text-muted">{t('app.metrics.chartHint')}</p>
          <SimpleBarChart
            points={chartPoints}
            series={[
              { key: 'revenue', label: t('app.metrics.revenue'), colorClass: 'bg-accent' },
              { key: 'profit', label: t('app.metrics.profit'), colorClass: 'bg-emerald-500' },
            ]}
            formatValue={(n) => formatMoney(n, currency)}
          />
        </Card>

        {!hasCostData && (
          <p className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-[12px] leading-relaxed text-muted">
            {t('app.metrics.profitHint')}{' '}
            <Link href="/stock" className="font-medium text-foreground underline-offset-2 hover:underline">
              {t('app.metrics.addCostsLink')}
            </Link>
          </p>
        )}
      </AppMain>
    </>
  )
}
