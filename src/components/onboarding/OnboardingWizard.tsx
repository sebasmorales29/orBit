'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BRAND_NAME } from '@/lib/brand'
import { themeFromPreset, type BrandPresetId } from '@/lib/onboarding/brand-theme'
import { completeTenantSetup } from '@/lib/onboarding/complete-tenant-setup'
import type { BillingCycle } from '@/lib/billing/types'
import {
  dashboardLayoutFromProfile,
  defaultWidgetPrefs,
} from '@/lib/onboarding/personalization'
import { SUBSCRIPTION_PLAN_IDS, type SubscriptionPlanId } from '@/lib/onboarding/plans'
import type {
  MainChallenge,
  OnboardingProfile,
  OrderVolume,
  SalesChannel,
  SuccessFocus,
  TeamSize,
} from '@/lib/onboarding/types'
import { storageKey } from '@/lib/dashboard/defaults'
import { OnboardingActivateStep } from '@/components/onboarding/OnboardingActivateStep'
import type { DashboardWidgetId } from '@/lib/dashboard/types'
import { OnboardingBrandStep } from '@/components/onboarding/OnboardingBrandStep'
import { OnboardingDashboardStep } from '@/components/onboarding/OnboardingDashboardStep'
import { OnboardingOption } from '@/components/onboarding/OnboardingOption'
import { OnboardingOtherField } from '@/components/onboarding/OnboardingOtherField'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Input } from '@/components/ui/Input'
import { ChromeControls } from '@/components/layout/ChromeControls'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import type { CurrencyCode } from '@/types/database'
import { transitionColors } from '@/lib/motion'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 8

const BUSINESS_TYPE_KEYS = [
  'food',
  'beauty',
  'perfumes',
  'barber',
  'jewelry',
  'apparel',
  'retail',
  'crafts',
  'services',
  'other',
] as const

const TEAM_SIZE_KEYS: TeamSize[] = ['solo', 'small', 'growing']
const CHANNEL_KEYS: SalesChannel[] = [
  'whatsapp',
  'instagram',
  'facebook',
  'tiktok',
  'physical',
  'website',
  'other',
]
const CHALLENGE_KEYS: MainChallenge[] = [
  'follow_ups',
  'orders',
  'stock',
  'payments',
  'everything',
  'other',
]
const FOCUS_KEYS: SuccessFocus[] = ['calm', 'sales', 'organized', 'professional', 'other']
const VOLUME_KEYS: OrderVolume[] = ['light', 'steady', 'busy', 'other']

export function OnboardingWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const toast = useToast()
  const [step, setStep] = useState(() => {
    const s = searchParams.get('step')
    return s === '8' ? 8 : 1
  })
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)

  const [preferredName, setPreferredName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessTypeKey, setBusinessTypeKey] = useState('')
  const [businessTypeOther, setBusinessTypeOther] = useState('')
  const [teamSize, setTeamSize] = useState<TeamSize | ''>('')
  const [salesChannelOther, setSalesChannelOther] = useState('')
  const [mainChallengeOther, setMainChallengeOther] = useState('')
  const [successFocusOther, setSuccessFocusOther] = useState('')
  const [orderVolumeOther, setOrderVolumeOther] = useState('')
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [mainChallenge, setMainChallenge] = useState<MainChallenge | ''>('')
  const [successFocus, setSuccessFocus] = useState<SuccessFocus | ''>('')
  const [orderVolume, setOrderVolume] = useState<OrderVolume | ''>('')
  const [currency, setCurrency] = useState<CurrencyCode>('CRC')
  const [usesStock, setUsesStock] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('profesional')
  const [brandPreset, setBrandPreset] = useState<BrandPresetId>('velum')
  const [customAccent, setCustomAccent] = useState('#d65a31')
  const [widgetPrefs, setWidgetPrefs] = useState<Partial<Record<DashboardWidgetId, boolean>>>(
    {}
  )
  const [widgetPrefsReady, setWidgetPrefsReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      const fromMeta = user?.user_metadata?.full_name as string | undefined
      if (fromMeta && !preferredName) {
        setPreferredName(fromMeta.split(' ')[0] ?? fromMeta)
      }
    })
  }, [preferredName])

  useEffect(() => {
    if (step !== 7 || widgetPrefsReady) return
    const draft: OnboardingProfile = {
      preferredName: preferredName.trim() || 'Usuario',
      businessTypeKey: businessTypeKey || 'retail',
      teamSize: (teamSize || 'solo') as TeamSize,
      salesChannels: salesChannels.length ? salesChannels : ['whatsapp'],
      mainChallenge: (mainChallenge || 'everything') as MainChallenge,
      successFocus: (successFocus || 'organized') as SuccessFocus,
      orderVolume: (orderVolume || 'steady') as OrderVolume,
      completedAt: new Date().toISOString(),
    }
    setWidgetPrefs(defaultWidgetPrefs(draft, usesStock))
    setWidgetPrefsReady(true)
  }, [
    step,
    widgetPrefsReady,
    preferredName,
    businessTypeKey,
    teamSize,
    salesChannels,
    mainChallenge,
    successFocus,
    orderVolume,
    usesStock,
  ])

  const businessTypes = useMemo(
    () => BUSINESS_TYPE_KEYS.map((key) => ({ key, label: t(`onboarding.types.${key}`) })),
    [t]
  )

  const businessTypeLabel =
    businessTypes.find((b) => b.key === businessTypeKey)?.label ?? ''

  function toggleChannel(channel: SalesChannel) {
    setSalesChannels((prev) => {
      const next = prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
      if (!next.includes('other')) setSalesChannelOther('')
      return next
    })
  }

  function otherTextOk(selected: boolean, text: string) {
    return !selected || text.trim().length >= 2
  }

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return preferredName.trim().length >= 2
      case 2:
        return (
          businessName.trim().length >= 2 &&
          businessTypeKey &&
          teamSize &&
          otherTextOk(businessTypeKey === 'other', businessTypeOther)
        )
      case 3:
        return (
          salesChannels.length > 0 &&
          mainChallenge &&
          otherTextOk(salesChannels.includes('other'), salesChannelOther) &&
          otherTextOk(mainChallenge === 'other', mainChallengeOther)
        )
      case 4:
        return (
          successFocus &&
          orderVolume &&
          otherTextOk(successFocus === 'other', successFocusOther) &&
          otherTextOk(orderVolume === 'other', orderVolumeOther)
        )
      case 5:
        return Boolean(selectedPlan)
      case 6:
        return true
      case 7:
        return Object.values(widgetPrefs).some(Boolean)
      default:
        return false
    }
  }, [
    step,
    preferredName,
    businessName,
    businessTypeKey,
    businessTypeOther,
    teamSize,
    salesChannels,
    salesChannelOther,
    mainChallenge,
    mainChallengeOther,
    successFocus,
    successFocusOther,
    orderVolume,
    orderVolumeOther,
    selectedPlan,
    widgetPrefs,
  ])

  function buildProfile(userEmail?: string | null): OnboardingProfile {
    const brandTheme = themeFromPreset(
      brandPreset,
      brandPreset === 'custom' ? customAccent : undefined
    )
    return {
      preferredName: preferredName.trim(),
      businessTypeKey,
      ...(businessTypeKey === 'other' && {
        businessTypeCustom: businessTypeOther.trim(),
      }),
      teamSize: teamSize as TeamSize,
      salesChannels,
      ...(salesChannels.includes('other') && {
        salesChannelCustom: salesChannelOther.trim(),
      }),
      mainChallenge: mainChallenge as MainChallenge,
      ...(mainChallenge === 'other' && {
        mainChallengeCustom: mainChallengeOther.trim(),
      }),
      successFocus: successFocus as SuccessFocus,
      ...(successFocus === 'other' && {
        successFocusCustom: successFocusOther.trim(),
      }),
      orderVolume: orderVolume as OrderVolume,
      ...(orderVolume === 'other' && {
        orderVolumeCustom: orderVolumeOther.trim(),
      }),
      completedAt: new Date().toISOString(),
      selectedPlan,
      ownerEmail: userEmail ?? undefined,
      brandTheme,
      dashboardWidgets: widgetPrefs,
    }
  }

  async function handlePrepareSetup(): Promise<string | null> {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return null
    }

    const profile = buildProfile(user.email)
    const brandTheme = profile.brandTheme!

    const result = await completeTenantSetup(supabase, user, {
      businessName: businessName.trim(),
      businessTypeLabel:
        businessTypeKey === 'other' ? businessTypeOther.trim() : businessTypeLabel,
      businessTypeKey,
      currency,
      usesStock,
      profile,
      brandTheme,
      selectedPlan,
    }, t('app.dashboard.picker.defaultName'))

    setLoading(false)

    if (!result.ok) {
      if (result.reason === 'migration_required') {
        toast.error(t('onboarding.errorMigration'))
      } else {
        toast.error(`${t('onboarding.errorCreate')} (${result.message ?? result.reason})`)
      }
      return null
    }

    const layout = dashboardLayoutFromProfile(profile, usesStock)
    localStorage.setItem(storageKey(result.organizationId, user.id), JSON.stringify(layout))
    setOrgId(result.organizationId)
    return result.organizationId
  }

  async function handleActivateSubscription(billingCycle: BillingCycle) {
    setLoading(true)

    let targetOrgId = orgId
    if (!targetOrgId) {
      targetOrgId = await handlePrepareSetup()
    }

    if (!targetOrgId) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: targetOrgId,
          planId: selectedPlan,
          billingCycle,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        checkoutUrl?: string
        alreadyActive?: boolean
      }

      if (!res.ok) {
        toast.error(data.message ?? t('onboarding.step8Error'))
        setLoading(false)
        return
      }

      if (data.alreadyActive && data.checkoutUrl === undefined) {
        router.push('/hoy?welcome=1')
        router.refresh()
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      toast.error(t('onboarding.step8Error'))
    } catch {
      toast.error(t('onboarding.step8Error'))
    }
    setLoading(false)
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <header>
              <p className="text-[12px] font-medium text-accent">{t('onboarding.step1Eyebrow')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step1Title')}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {t('onboarding.step1Subtitle')}
              </p>
            </header>
            <Input
              label={t('onboarding.preferredName')}
              placeholder={t('onboarding.preferredNamePlaceholder')}
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              required
            />
            <p className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-[12px] leading-relaxed text-muted">
              {t('onboarding.step1Affirmation')}
            </p>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <header>
              <p className="text-[12px] font-medium text-accent">
                {t('onboarding.step2Eyebrow', { name: preferredName })}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step2Title')}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {t('onboarding.step2Subtitle')}
              </p>
            </header>
            <Input
              label={t('onboarding.businessName')}
              placeholder={t('onboarding.businessNamePlaceholder')}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.businessType')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {businessTypes.map(({ key, label }) => (
                  <OnboardingOption
                    key={key}
                    selected={businessTypeKey === key}
                    onClick={() => {
                      setBusinessTypeKey(key)
                      if (key !== 'other') setBusinessTypeOther('')
                    }}
                    title={label}
                    className="py-2.5"
                  />
                ))}
              </div>
              {businessTypeKey === 'other' && (
                <OnboardingOtherField
                  label={t('onboarding.otherLabel.businessType')}
                  placeholder={t('onboarding.otherPlaceholder.businessType')}
                  value={businessTypeOther}
                  onChange={setBusinessTypeOther}
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.teamSize')}
              </p>
              <div className="space-y-2">
                {TEAM_SIZE_KEYS.map((key) => (
                  <OnboardingOption
                    key={key}
                    selected={teamSize === key}
                    onClick={() => setTeamSize(key)}
                    title={t(`onboarding.teamSizeOptions.${key}`)}
                    description={t(`onboarding.teamSizeDesc.${key}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <header>
              <p className="text-[12px] font-medium text-accent">{t('onboarding.step3Eyebrow')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step3Title')}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {t('onboarding.step3Subtitle')}
              </p>
            </header>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.salesChannels')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CHANNEL_KEYS.map((key) => (
                  <OnboardingOption
                    key={key}
                    selected={salesChannels.includes(key)}
                    onClick={() => toggleChannel(key)}
                    title={t(`onboarding.channels.${key}`)}
                    className="py-2.5"
                  />
                ))}
              </div>
              {salesChannels.includes('other') && (
                <OnboardingOtherField
                  label={t('onboarding.otherLabel.channel')}
                  placeholder={t('onboarding.otherPlaceholder.channel')}
                  value={salesChannelOther}
                  onChange={setSalesChannelOther}
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.mainChallenge')}
              </p>
              <div className="space-y-2">
                {CHALLENGE_KEYS.map((key) => (
                  <OnboardingOption
                    key={key}
                    selected={mainChallenge === key}
                    onClick={() => {
                      setMainChallenge(key)
                      if (key !== 'other') setMainChallengeOther('')
                    }}
                    title={t(`onboarding.challenges.${key}`)}
                    description={
                      key === 'other'
                        ? t('onboarding.challengesDesc.other')
                        : t(`onboarding.challengesDesc.${key}`)
                    }
                  />
                ))}
              </div>
              {mainChallenge === 'other' && (
                <OnboardingOtherField
                  label={t('onboarding.otherLabel.challenge')}
                  placeholder={t('onboarding.otherPlaceholder.challenge')}
                  value={mainChallengeOther}
                  onChange={setMainChallengeOther}
                />
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <header>
              <p className="text-[12px] font-medium text-accent">{t('onboarding.step4Eyebrow')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step4Title')}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {t('onboarding.step4Subtitle')}
              </p>
            </header>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.successFocus')}
              </p>
              <div className="space-y-2">
                {FOCUS_KEYS.map((key) => (
                  <OnboardingOption
                    key={key}
                    selected={successFocus === key}
                    onClick={() => {
                      setSuccessFocus(key)
                      if (key !== 'other') setSuccessFocusOther('')
                    }}
                    title={t(`onboarding.focus.${key}`)}
                    description={
                      key === 'other'
                        ? t('onboarding.focusDesc.other')
                        : t(`onboarding.focusDesc.${key}`)
                    }
                  />
                ))}
              </div>
              {successFocus === 'other' && (
                <OnboardingOtherField
                  label={t('onboarding.otherLabel.focus')}
                  placeholder={t('onboarding.otherPlaceholder.focus')}
                  value={successFocusOther}
                  onChange={setSuccessFocusOther}
                />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.orderVolume')}
              </p>
              <div className="space-y-2">
                {VOLUME_KEYS.map((key) => (
                  <OnboardingOption
                    key={key}
                    selected={orderVolume === key}
                    onClick={() => {
                      setOrderVolume(key)
                      if (key !== 'other') setOrderVolumeOther('')
                    }}
                    title={t(`onboarding.volume.${key}`)}
                    description={
                      key === 'other'
                        ? t('onboarding.volumeDesc.other')
                        : t(`onboarding.volumeDesc.${key}`)
                    }
                  />
                ))}
              </div>
              {orderVolume === 'other' && (
                <OnboardingOtherField
                  label={t('onboarding.otherLabel.volume')}
                  placeholder={t('onboarding.otherPlaceholder.volume')}
                  value={orderVolumeOther}
                  onChange={setOrderVolumeOther}
                />
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <header>
              <p className="text-[12px] font-medium text-accent">{t('onboarding.step5Eyebrow')}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step5Title')}</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {t('onboarding.step5Subtitle')}
              </p>
            </header>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.selectedPlan')}
              </p>
              <div className="space-y-2">
                {SUBSCRIPTION_PLAN_IDS.map((planId) => (
                  <OnboardingOption
                    key={planId}
                    selected={selectedPlan === planId}
                    onClick={() => setSelectedPlan(planId)}
                    title={t(`landing.pricing.plans.${planId}.name`)}
                    description={t(`landing.pricing.plans.${planId}.tagline`)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.currency')}
              </p>
              <SegmentedControl<CurrencyCode>
                value={currency}
                onChange={setCurrency}
                fullWidth
                shape="rounded"
                thumbVariant="soft"
                options={[
                  { id: 'CRC', label: t('onboarding.currencyCrc') },
                  { id: 'USD', label: t('onboarding.currencyUsd') },
                ]}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {t('onboarding.usesStock')}
              </p>
              <SegmentedControl<'yes' | 'no'>
                value={usesStock ? 'yes' : 'no'}
                onChange={(v) => setUsesStock(v === 'yes')}
                fullWidth
                shape="rounded"
                thumbVariant="soft"
                size="sm"
                options={[
                  { id: 'yes', label: t('onboarding.stockYes') },
                  { id: 'no', label: t('onboarding.stockNo') },
                ]}
              />
            </div>

            <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {t('onboarding.summaryTitle', { name: preferredName })}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">
                    {t('onboarding.summaryBody', {
                      business: businessName,
                      focus: t(`onboarding.focus.${successFocus}`),
                      challenge: t(`onboarding.challenges.${mainChallenge}`),
                    })}
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-muted">
                    <li>· {businessTypeLabel}</li>
                    <li>
                      · {salesChannels.map((c) => t(`onboarding.channels.${c}`)).join(', ')}
                    </li>
                    <li>· {t(`onboarding.volume.${orderVolume}`)}</li>
                  </ul>
                  <p className="mt-3 text-[12px] font-medium text-foreground">
                    {t('onboarding.summaryClosing')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <OnboardingBrandStep
            presetId={brandPreset}
            customAccent={customAccent}
            onPresetChange={setBrandPreset}
            onCustomAccentChange={setCustomAccent}
          />
        )

      case 7:
        return (
          <OnboardingDashboardStep
            prefs={widgetPrefs}
            usesStock={usesStock}
            onToggle={(id, enabled) =>
              setWidgetPrefs((prev) => ({ ...prev, [id]: enabled }))
            }
          />
        )

      case 8:
        return (
          <OnboardingActivateStep
            preferredName={preferredName.trim()}
            businessName={businessName.trim()}
            planId={selectedPlan}
            loading={loading}
            canceled={searchParams.get('canceled') === '1'}
            onActivate={handleActivateSubscription}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col px-6 py-12">
      <ChromeControls className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" />

      <div className="mx-auto w-full max-w-md flex-1">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {t('onboarding.stepOf', { step, total: TOTAL_STEPS })}
          </p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  transitionColors,
                  step > i ? 'bg-accent' : step === i + 1 ? 'bg-accent/60' : 'bg-border'
                )}
              />
            ))}
          </div>
        </div>

        {renderStep()}

        {step < 8 && (
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button variant="secondary" className="flex-1" onClick={() => setStep((s) => s - 1)}>
                {t('onboarding.back')}
              </Button>
            )}
            {step < 7 ? (
              <Button
                className="flex-1"
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
              >
                {t('onboarding.continue')}
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={!canContinue}
                loading={loading}
                onClick={async () => {
                  const id = await handlePrepareSetup()
                  if (id) setStep(8)
                }}
              >
                {t('onboarding.continueToPayment')}
              </Button>
            )}
          </div>
        )}
        {step === 8 && (
          <div className="mt-4">
            <Button variant="secondary" className="w-full" onClick={() => setStep(7)}>
              {t('onboarding.back')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
