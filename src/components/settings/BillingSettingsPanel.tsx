'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarClock, CreditCard, RefreshCw, ShieldCheck } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { checkoutAmountCents, pricePerMonthUsd } from '@/lib/billing/pricing'
import type { BillingCycle, SubscriptionSnapshot } from '@/lib/billing/types'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import { SUBSCRIPTION_PLAN_IDS } from '@/lib/onboarding/plans'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { formatMoney } from '@/types/database'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function BillingSettingsPanel() {
  const { t } = useTranslations()
  const toast = useToast()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null)
  const [planId, setPlanId] = useState<SubscriptionPlanId>('profesional')
  const [cycle, setCycle] = useState<BillingCycle>('annual')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/subscription')
      if (!res.ok) throw new Error('load_failed')
      const data = (await res.json()) as SubscriptionSnapshot
      setSnapshot(data)
      setPlanId(data.planId)
      setCycle(data.billingCycle)
    } catch {
      toast.error(t('billing.settings.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const billing = searchParams.get('billing')
    const error = searchParams.get('error')
    const canceled = searchParams.get('canceled')
    if (billing === 'success') toast.success(t('billing.settings.paymentSuccess'))
    if (error) toast.error(t('billing.settings.paymentError'))
    if (canceled === '1') toast.success(t('billing.settings.paymentCanceled'))
  }, [searchParams, t, toast])

  const previewAmount = checkoutAmountCents(planId, cycle)
  const previewPerMonth = pricePerMonthUsd(planId, cycle)

  const planOptions = useMemo(
    () =>
      SUBSCRIPTION_PLAN_IDS.map((id) => ({
        id,
        label: t(`landing.pricing.plans.${id}.name`),
      })),
    [t]
  )

  const cycleOptions = useMemo(
    () => [
      { id: 'monthly' as const, label: t('billing.cycle.monthly') },
      { id: 'semiannual' as const, label: t('billing.cycle.semiannual') },
      { id: 'annual' as const, label: t('billing.cycle.annual') },
    ],
    [t]
  )

  const hasChanges =
    snapshot && (snapshot.planId !== planId || snapshot.billingCycle !== cycle)

  async function applyChange() {
    if (!snapshot?.isOwner) {
      toast.error(t('billing.settings.ownerOnly'))
      return
    }
    setActing(true)
    try {
      const res = await fetch('/api/billing/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'change_failed')

      if (data.scheduled) {
        toast.success(data.message ?? t('billing.settings.scheduled'))
        await load()
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('billing.settings.changeError'))
    } finally {
      setActing(false)
    }
  }

  async function updateCard() {
    if (!snapshot?.isOwner) {
      toast.error(t('billing.settings.ownerOnly'))
      return
    }
    setActing(true)
    try {
      const res = await fetch('/api/billing/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: snapshot?.planId ?? planId,
          billingCycle: snapshot?.billingCycle ?? cycle,
          purpose: 'update_card',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'card_failed')
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('billing.settings.changeError'))
    } finally {
      setActing(false)
    }
  }

  async function toggleCancel(action: 'cancel' | 'reactivate') {
    if (!snapshot?.isOwner) {
      toast.error(t('billing.settings.ownerOnly'))
      return
    }
    setActing(true)
    try {
      const res = await fetch('/api/billing/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'cancel_failed')
      toast.success(
        action === 'cancel'
          ? t('billing.settings.cancelScheduled')
          : t('billing.settings.reactivated')
      )
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('billing.settings.changeError'))
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-[13px] text-muted">
        {t('billing.settings.loading')}
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-[13px] text-muted">
        {t('billing.settings.unavailable')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {snapshot.status === 'past_due' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-100">
          {t('billing.settings.pastDue')}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {t('billing.settings.currentPlan')}
        </p>
        <p className="mt-2 text-xl font-semibold text-foreground">
          {t(`landing.pricing.plans.${snapshot.planId}.name`)}
        </p>
        <p className="text-[13px] text-muted">
          {t(`landing.pricing.plans.${snapshot.planId}.tagline`)}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {t('billing.settings.periodEnd')}
            </p>
            <p className="mt-1 text-[14px] font-medium">
              {snapshot.periodEnd
                ? new Date(snapshot.periodEnd).toLocaleDateString('es-CR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-raised p-3">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              {t('billing.settings.nextBilling')}
            </p>
            <p className="mt-1 text-[14px] font-medium">
              {snapshot.nextBillingAt
                ? new Date(snapshot.nextBillingAt).toLocaleDateString('es-CR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-muted">
          {t('billing.settings.currentAmount', {
            amount: formatMoney(snapshot.amountCents / 100, 'USD'),
            cycle: t(`billing.cycle.${snapshot.billingCycle}`),
            perMonth: String(snapshot.perMonthUsd),
          })}
        </p>

        {snapshot.cancelAtPeriodEnd && (
          <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-100">
            {t('billing.settings.cancelPending')}
          </p>
        )}

        {(snapshot.scheduledPlanId || snapshot.scheduledCycle) && (
          <p className="mt-3 rounded-lg border border-accent/25 bg-accent-soft/40 px-3 py-2 text-[12px] text-foreground">
            {t('billing.settings.scheduledChange', {
              plan: snapshot.scheduledPlanId
                ? t(`landing.pricing.plans.${snapshot.scheduledPlanId}.name`)
                : t(`landing.pricing.plans.${snapshot.planId}.name`),
              cycle: t(
                `billing.cycle.${snapshot.scheduledCycle ?? snapshot.billingCycle}`
              ),
            })}
          </p>
        )}
      </section>

      {snapshot.isOwner ? (
        <section className="rounded-2xl border border-border bg-surface p-5 space-y-5">
          <div>
            <p className="text-[14px] font-medium text-foreground">
              {t('billing.settings.changeTitle')}
            </p>
            <p className="mt-1 text-[12px] text-muted">{t('billing.settings.changeHint')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {planOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPlanId(opt.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] font-medium',
                  planId === opt.id
                    ? 'border-foreground bg-foreground text-surface'
                    : 'border-border text-muted hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <SegmentedControl<BillingCycle>
            value={cycle}
            onChange={setCycle}
            fullWidth
            shape="rounded"
            thumbVariant="foreground"
            options={cycleOptions}
          />

          <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
            <p className="text-[12px] text-muted">{t('billing.settings.preview')}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatMoney(previewAmount / 100, 'USD')}
            </p>
            <p className="text-[12px] text-muted">
              {t('onboarding.step8TotalHint', { perMonth: String(previewPerMonth) })}
            </p>
          </div>

          <button
            type="button"
            disabled={acting || !hasChanges}
            onClick={() => void applyChange()}
            className="w-full rounded-full bg-foreground py-3.5 text-[14px] font-semibold text-surface disabled:opacity-50"
          >
            {acting ? t('billing.settings.processing') : t('billing.settings.applyChange')}
          </button>

          <p className="text-[11px] text-muted-foreground">{t('billing.settings.timingNote')}</p>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row">
            <button
              type="button"
              disabled={acting}
              onClick={() => void updateCard()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-[13px] font-medium"
            >
              <CreditCard className="h-4 w-4" />
              {t('billing.settings.updateCard')}
            </button>
            {snapshot.cancelAtPeriodEnd ? (
              <button
                type="button"
                disabled={acting}
                onClick={() => void toggleCancel('reactivate')}
                className="flex-1 rounded-full border border-border px-4 py-3 text-[13px] font-medium"
              >
                {t('billing.settings.keepSubscription')}
              </button>
            ) : (
              <button
                type="button"
                disabled={acting || snapshot.status === 'canceled'}
                onClick={() => void toggleCancel('cancel')}
                className="flex-1 rounded-full border border-border px-4 py-3 text-[13px] font-medium text-muted"
              >
                {t('billing.settings.cancelAtEnd')}
              </button>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4 text-[13px] text-muted">
          <ShieldCheck className="mb-2 h-4 w-4" />
          {t('billing.settings.ownerOnly')}
        </div>
      )}

      {snapshot.events.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[14px] font-medium">{t('billing.settings.history')}</p>
          <ul className="mt-3 space-y-2">
            {snapshot.events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-3 text-[12px] text-muted"
              >
                <span>
                  {(
                    {
                      activation: t('billing.settings.event.activation'),
                      renewal: t('billing.settings.event.renewal'),
                      plan_change: t('billing.settings.event.plan_change'),
                      cycle_change: t('billing.settings.event.cycle_change'),
                      scheduled_change: t('billing.settings.event.scheduled_change'),
                      card_update: t('billing.settings.event.card_update'),
                      canceled: t('billing.settings.event.canceled'),
                      reactivated: t('billing.settings.event.reactivated'),
                      payment_failed: t('billing.settings.event.payment_failed'),
                    } as Record<string, string>
                  )[ev.event_type] ?? ev.event_type}
                </span>
                <span className="tabular-nums text-foreground">
                  {ev.amount_cents ? formatMoney(ev.amount_cents / 100, 'USD') : '—'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
