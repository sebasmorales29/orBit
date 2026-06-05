'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useBusinessAdaptation } from '@/components/app/BusinessContextProvider'
import { DashboardQuickBar } from '@/components/hoy/DashboardQuickBar'
import { HoyAiAssistant } from '@/components/hoy/HoyAiAssistant'
import { EmptyState } from '@/components/app/EmptyState'
import { SectionLabel } from '@/components/app/SectionLabel'
import { Card } from '@/components/ui/Card'
import { adaptLabel, adaptLabelWithPeriod } from '@/lib/business-context/labels'
import type { HoyDashboardData } from '@/lib/dashboard/hoy-data'
import type { DashboardWidgetId } from '@/lib/dashboard/types'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import {
  formatMoney,
  INQUIRY_STATUS_LABELS,
  type CurrencyCode,
  type LeadStatus,
  type TodayAction,
} from '@/types/database'
import { cn } from '@/lib/utils'
import { DASHBOARD_WIDGET_META } from '@/lib/dashboard/widget-meta'

const URGENCY_BORDER = {
  high: 'border-l-accent',
  medium: 'border-l-muted',
  low: 'border-l-border',
}

function PriorityRow({ action, currency }: { action: TodayAction; currency: CurrencyCode }) {
  return (
    <Link href={action.href ?? '#'} className="block">
      <div
        className={cn(
          'flex items-center justify-between gap-4 border-b border-border-subtle border-l-2 py-4 pl-4 pr-3 transition-colors last:border-b-0 hover:bg-surface-raised sm:py-5',
          URGENCY_BORDER[action.urgency]
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-foreground">{action.title}</p>
          <p className="mt-0.5 text-[12px] text-muted">{action.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action.amount != null && (
            <span className="text-[13px] font-medium">{formatMoney(action.amount, currency)}</span>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>
    </Link>
  )
}

export function DashboardWidgetFrame({
  widgetId,
  children,
  compact,
}: {
  widgetId: DashboardWidgetId
  children: React.ReactNode
  compact?: boolean
}) {
  const { t } = useTranslations()
  const meta = DASHBOARD_WIDGET_META.find((m) => m.id === widgetId)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#2d3f56] bg-[#121a24] shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#2d3f56] bg-[#1a2636] px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00d4aa]" aria-hidden />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8eb4d4]">
          {meta ? t(meta.labelKey) : widgetId}
        </span>
      </div>
      <div className={cn('min-h-0 flex-1 overflow-auto', compact ? 'p-2' : 'p-3 sm:p-4')}>
        {children}
      </div>
    </div>
  )
}

function PreviewEmpty({ message }: { message: string }) {
  return (
    <p className="rounded border border-dashed border-[#2d3f56] bg-[#0f151d]/80 px-3 py-6 text-center font-mono text-[11px] text-[#5a7a94]">
      {message}
    </p>
  )
}

export function HoyWidgetRenderer({
  widgetId,
  data,
  framed = true,
  studioPreview,
}: {
  widgetId: DashboardWidgetId
  data: HoyDashboardData
  framed?: boolean
  studioPreview?: boolean
}) {
  const { t } = useTranslations()
  const adaptation = useBusinessAdaptation()
  const scope = adaptation.labelScope
  const pipelineStatuses: LeadStatus[] = ['nuevo', 'interesado', 'cotizado', 'por_cerrar']

  function tr(key: string, fallbackKey: string) {
    const v = t(key)
    return v === key ? t(fallbackKey) : v
  }

  function wrap(content: React.ReactNode, compact?: boolean) {
    if (!framed) return content
    return (
      <DashboardWidgetFrame widgetId={widgetId} compact={compact}>
        {content}
      </DashboardWidgetFrame>
    )
  }

  switch (widgetId) {
    case 'greeting':
      return wrap(
        <>
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {data.welcomeLine}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {data.actions.length > 0
              ? t('app.dashboard.actionsCount', { count: data.actions.length })
              : tr(adaptation.panelSubtitleKey, 'app.adapt.panel.default.default')}
          </p>
          <p className="mt-3 rounded border border-[#2d3f56] bg-[#0f151d] px-3 py-2.5 text-[12px] leading-relaxed text-[#9eb0c4]">
            {tr(adaptation.dailyInsightKey, 'app.adapt.insights.default.default')}
          </p>
        </>
      )

    case 'ai_assistant':
      return framed ? (
        <DashboardWidgetFrame widgetId="ai_assistant">
          <HoyAiAssistant data={data} embedded />
        </DashboardWidgetFrame>
      ) : (
        <HoyAiAssistant data={data} />
      )

    case 'kpis':
      return wrap(
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Card className="border-[#2d3f56] bg-[#0f151d] px-3 py-3">
            <p className="text-[10px] text-[#8eb4d4]">{adaptLabel(scope, 'kpiLeads', t)}</p>
            <p className="mt-1 text-xl font-semibold">{data.stats.activeLeads}</p>
          </Card>
          <Card className="border-[#2d3f56] bg-[#0f151d] px-3 py-3">
            <p className="text-[10px] text-[#8eb4d4]">{adaptLabel(scope, 'kpiOrders', t)}</p>
            <p className="mt-1 text-xl font-semibold">{data.stats.openOrders}</p>
          </Card>
          <Card className="border-[#2d3f56] bg-[#0f151d] px-3 py-3">
            <p className="text-[10px] text-[#8eb4d4]">
              {adaptLabelWithPeriod(scope, 'kpiRevenue', t, data.periodLabel)}
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatMoney(data.stats.revenueMonth, data.currency)}
            </p>
          </Card>
          <Card className="border-[#2d3f56] bg-[#0f151d] px-3 py-3">
            <p className="text-[10px] text-[#8eb4d4]">
              {adaptLabelWithPeriod(scope, 'kpiProfit', t, data.periodLabel)}
            </p>
            <p className="mt-1 text-base font-semibold">
              {formatMoney(data.stats.profitMonth, data.currency)}
            </p>
          </Card>
          <Card className="col-span-2 border-[#2d3f56] bg-[#0f151d] px-3 py-3 md:col-span-1">
            <p className="text-[10px] text-[#8eb4d4]">{adaptLabel(scope, 'kpiPending', t)}</p>
            <p className="mt-1 text-base font-semibold">
              {formatMoney(data.stats.pendingCollect, data.currency)}
            </p>
          </Card>
        </div>,
        true
      )

    case 'quick_actions':
      return wrap(
        <>
          <SectionLabel>{adaptLabel(scope, 'quickActionsTitle', t)}</SectionLabel>
          <div className="mt-2">
            <DashboardQuickBar />
          </div>
        </>,
        true
      )

    case 'priorities':
      return wrap(
        <>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <SectionLabel>{adaptLabel(scope, 'prioritiesTitle', t)}</SectionLabel>
            {data.actions.length > 0 && (
              <span className="font-mono text-[10px] text-[#8eb4d4]">
                {t('app.dashboard.prioritiesHint', { count: data.actions.length })}
              </span>
            )}
          </div>
          {!data.hasAnyData ? (
            <EmptyState title={t('app.dashboard.emptyTitle')} description={t('app.dashboard.emptyDesc')}>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/ventas"
                  className="inline-flex rounded-full bg-accent px-5 py-2.5 text-[13px] font-medium text-on-accent"
                >
                  {t('app.dashboard.emptySale')}
                </Link>
                <Link
                  href="/consultas"
                  className="inline-flex rounded-full border border-border px-5 py-2.5 text-[13px] font-medium"
                >
                  {t('app.dashboard.emptyInquiry')}
                </Link>
              </div>
            </EmptyState>
          ) : data.actions.length === 0 ? (
            <EmptyState title={t('app.hoy.empty')} description={t('app.hoy.emptyHint')} />
          ) : (
            <div className="overflow-hidden rounded border border-[#2d3f56] bg-[#0f151d]">
              {data.actions.map((action) => (
                <PriorityRow key={action.id} action={action} currency={data.currency} />
              ))}
            </div>
          )}
        </>
      )

    case 'pipeline':
      return wrap(
        <>
          <SectionLabel>{adaptLabel(scope, 'pipelineTitle', t)}</SectionLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {pipelineStatuses.map((status) => (
              <Link
                key={status}
                href="/consultas"
                className="rounded border border-[#2d3f56] bg-[#0f151d] py-3 text-center transition-colors hover:border-[#00d4aa]/40"
              >
                <p className="text-xl font-semibold">{data.pipeline[status] ?? 0}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8eb4d4]">
                  {INQUIRY_STATUS_LABELS[status]}
                </p>
              </Link>
            ))}
          </div>
        </>,
        true
      )

      case 'recent_leads':
        if (data.recentLeads.length === 0) {
          if (!studioPreview) return null
          return wrap(
            <PreviewEmpty message={t('app.dashboard.studio.previewEmptyLeads')} />,
            true
          )
        }
        return wrap(
        <>
          <SectionLabel>{adaptLabel(scope, 'recentLeadsTitle', t)}</SectionLabel>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.recentLeads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/consultas/${lead.id}`}
                  className="block rounded border border-[#2d3f56] bg-[#0f151d] px-3 py-2.5 hover:border-[#00d4aa]/30"
                >
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#8eb4d4]">
                    {INQUIRY_STATUS_LABELS[lead.status]}
                    {lead.product_interest ? ` · ${lead.product_interest}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>,
        true
      )

      case 'low_stock':
        if (!data.usesStock) {
          if (!studioPreview) return null
          return wrap(
            <PreviewEmpty message={t('app.dashboard.studio.previewStockOff')} />,
            true
          )
        }
        if (data.lowStockProducts.length === 0) {
          if (!studioPreview) return null
          return wrap(
            <PreviewEmpty message={t('app.dashboard.studio.previewEmptyStock')} />,
            true
          )
        }
        return wrap(
        <>
          <SectionLabel>{adaptLabel(scope, 'lowStockTitle', t)}</SectionLabel>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.lowStockProducts.map((p) => (
              <li key={p.id}>
                <Link
                  href="/stock"
                  className="flex items-center justify-between rounded border border-[#00d4aa]/30 bg-[#00d4aa]/10 px-3 py-2.5"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[12px] font-semibold text-[#00d4aa]">
                    {p.stock} / {p.stock_minimum}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>,
        true
      )

    default:
      return null
  }
}

export function widgetHasContent(widgetId: DashboardWidgetId, data: HoyDashboardData): boolean {
  if (widgetId === 'recent_leads') return data.recentLeads.length > 0
  if (widgetId === 'low_stock') return data.usesStock && data.lowStockProducts.length > 0
  return true
}

export function spanClass(span: number): string {
  switch (span) {
    case 3:
      return 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3'
    case 4:
      return 'col-span-12 sm:col-span-6 lg:col-span-4'
    case 6:
      return 'col-span-12 md:col-span-6'
    case 8:
      return 'col-span-12 lg:col-span-8'
    default:
      return 'col-span-12'
  }
}
