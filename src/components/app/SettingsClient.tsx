'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { CurrencyCode } from '@/types/database'
import { SectionLabel } from '@/components/app/SectionLabel'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { OnboardingOtherField } from '@/components/onboarding/OnboardingOtherField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/toast'
import { transitionColors } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme/ThemeProvider'
import { SettingsSections } from '@/components/settings/SettingsSections'
import { BillingSettingsPanel } from '@/components/settings/BillingSettingsPanel'
import { TenantSwitcher } from '@/components/app/TenantSwitcher'
import type { TenantPickerOrg } from '@/components/app/TenantPickerModal'

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

type BusinessTypeKey = (typeof BUSINESS_TYPE_KEYS)[number]

export interface SettingsInitialData {
  organizationId: string
  organizations: TenantPickerOrg[]
  businessName: string
  businessType: string | null
  currency: CurrencyCode
  usesStock: boolean
  onboardingProfile: OnboardingProfile | null
  email: string
  preferredName: string
  myRole: string | null
  memberCount: number | null
}

function parseBusinessType(
  businessType: string | null,
  profile: OnboardingProfile | null
): { key: BusinessTypeKey; custom: string } {
  if (profile?.businessTypeKey && BUSINESS_TYPE_KEYS.includes(profile.businessTypeKey as BusinessTypeKey)) {
    return {
      key: profile.businessTypeKey as BusinessTypeKey,
      custom: profile.businessTypeCustom ?? '',
    }
  }
  if (businessType) {
    return { key: 'other', custom: businessType }
  }
  return { key: 'other', custom: '' }
}

function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-surface',
        className
      )}
    >
      {children}
    </section>
  )
}

export function SettingsClient({ initial }: { initial: SettingsInitialData }) {
  return (
    <Suspense>
      <SettingsClientInner initial={initial} />
    </Suspense>
  )
}

function SettingsClientInner({ initial }: { initial: SettingsInitialData }) {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()
  const { theme, setTheme } = useTheme()

  const parsedType = parseBusinessType(initial.businessType, initial.onboardingProfile)
  const initialSettings = initial.onboardingProfile?.settings ?? {}

  const [preferredName, setPreferredName] = useState(initial.preferredName)
  const [businessName, setBusinessName] = useState(initial.businessName)
  const [businessTypeKey, setBusinessTypeKey] = useState<BusinessTypeKey>(parsedType.key)
  const [businessTypeOther, setBusinessTypeOther] = useState(parsedType.custom)
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency)
  const [usesStock, setUsesStock] = useState(initial.usesStock)

  const [timezone, setTimezone] = useState(initialSettings.timezone ?? 'America/Costa_Rica')
  const [region, setRegion] = useState(initialSettings.region ?? 'es-CR')
  const [notifEmail, setNotifEmail] = useState(initialSettings.notifications?.email ?? true)
  const [notifInApp, setNotifInApp] = useState(initialSettings.notifications?.inApp ?? true)

  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const currencyOptions = useMemo(
    () => [
      { id: 'CRC' as const, label: t('app.settings.currencyCrc') },
      { id: 'USD' as const, label: t('app.settings.currencyUsd') },
    ],
    [t]
  )

  const stockOptions = useMemo(
    () => [
      { id: 'on' as const, label: t('common.active') },
      { id: 'off' as const, label: t('common.inactive') },
    ],
    [t]
  )

  function resolveBusinessTypeLabel(): string {
    if (businessTypeKey === 'other') {
      return businessTypeOther.trim() || t('onboarding.types.other')
    }
    return t(`onboarding.types.${businessTypeKey}`)
  }

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault()
    if (!preferredName.trim()) {
      toast.error(t('toast.required', { field: t('app.settings.preferredName') }))
      return
    }

    setSavingPersonal(true)
    const supabase = createClient()
    const trimmed = preferredName.trim()

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    })

    if (authError) {
      setSavingPersonal(false)
      toast.error(t('app.settings.errorSave'))
      return
    }

    const profile: OnboardingProfile = {
      ...(initial.onboardingProfile ?? {
        businessTypeKey: 'other',
        teamSize: 'solo',
        salesChannels: [],
        mainChallenge: 'everything',
        successFocus: 'organized',
        orderVolume: 'steady',
        completedAt: new Date().toISOString(),
      }),
      preferredName: trimmed,
    }

    await supabase
      .from('organizations')
      .update({ onboarding_profile: profile })
      .eq('id', initial.organizationId)

    setSavingPersonal(false)
    toast.success(t('app.settings.saved'))
    router.refresh()
  }

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) {
      toast.error(t('toast.required', { field: t('app.settings.businessName') }))
      return
    }
    if (businessTypeKey === 'other' && businessTypeOther.trim().length < 2) {
      toast.error(t('toast.required', { field: t('app.settings.otherTypeLabel') }))
      return
    }

    setSavingBusiness(true)
    const supabase = createClient()
    const typeLabel = resolveBusinessTypeLabel()

    const profile: OnboardingProfile = {
      ...(initial.onboardingProfile ?? {
        preferredName: preferredName.trim() || initial.preferredName,
        teamSize: 'solo',
        salesChannels: [],
        mainChallenge: 'everything',
        successFocus: 'organized',
        orderVolume: 'steady',
        completedAt: new Date().toISOString(),
      }),
      businessTypeKey,
      ...(businessTypeKey === 'other'
        ? { businessTypeCustom: businessTypeOther.trim() }
        : { businessTypeCustom: undefined }),
    }

    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        name: businessName.trim(),
        business_type: typeLabel,
        currency,
        uses_stock: usesStock,
        onboarding_profile: profile,
      })
      .eq('id', initial.organizationId)

    setSavingBusiness(false)
    if (orgError) {
      toast.error(t('app.settings.errorSave'))
      return
    }
    toast.success(t('app.settings.saved'))
    router.refresh()
  }

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault()
    setSavingPrefs(true)
    const supabase = createClient()

    const profile: OnboardingProfile = {
      ...(initial.onboardingProfile ?? {
        preferredName: preferredName.trim() || initial.preferredName,
        businessTypeKey: 'other',
        teamSize: 'solo',
        salesChannels: [],
        mainChallenge: 'everything',
        successFocus: 'organized',
        orderVolume: 'steady',
        completedAt: new Date().toISOString(),
      }),
      settings: {
        timezone,
        region,
        notifications: {
          email: notifEmail,
          inApp: notifInApp,
        },
      },
    }

    const { error } = await supabase
      .from('organizations')
      .update({ onboarding_profile: profile })
      .eq('id', initial.organizationId)

    setSavingPrefs(false)
    if (error) {
      toast.error(t('app.settings.errorSave'))
      return
    }

    toast.success(t('app.settings.saved'))
    router.refresh()
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const preferencesView = (
    <div className="space-y-6">
      <div>
        <SectionLabel>{t('app.settings.preferences')}</SectionLabel>
        <SettingsCard className="mt-2 p-4">
          <p className="text-[14px] font-medium text-foreground">{t('app.settings.language')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{t('app.settings.languageHint')}</p>
          <div className="mt-4 flex justify-start">
            <LanguageToggle className="border border-border-subtle bg-surface-raised shadow-none dark:bg-surface-card" />
          </div>
        </SettingsCard>
      </div>

      <form onSubmit={savePreferences}>
        <SectionLabel>{t('app.settings.tenantPreferences')}</SectionLabel>
        <SettingsCard className="mt-2 space-y-4 p-4">
          <div>
            <p className="text-[14px] font-medium text-foreground">{t('app.settings.theme')}</p>
            <p className="mt-1 text-[12px] text-muted">{t('app.settings.themeHint')}</p>
            <div className="mt-3">
              <SegmentedControl
                value={theme}
                onChange={(v) => setTheme(v)}
                options={[
                  { id: 'system', label: t('app.settings.themeAuto') },
                  { id: 'light', label: t('app.settings.themeLight') },
                  { id: 'dark', label: t('app.settings.themeDark') },
                ]}
                shape="rounded"
                size="md"
                fullWidth
                thumbVariant="accent"
                ariaLabel="Tema"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {t('app.settings.timezone')}
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
              >
                <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
                <option value="America/Mexico_City">CDMX</option>
                <option value="America/Guatemala">Guatemala</option>
                <option value="America/Bogota">Bogotá</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {t('app.settings.region')}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-[14px]"
              >
                <option value="es-CR">Costa Rica (es-CR)</option>
                <option value="es-MX">México (es-MX)</option>
                <option value="es-ES">España (es-ES)</option>
                <option value="en-US">USA (en-US)</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-[14px] font-medium text-foreground">{t('app.settings.notifications')}</p>
              <p className="mt-1 text-[12px] text-muted">{t('app.settings.notificationsHint')}</p>
            <div className="mt-3 grid gap-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <span className="text-[13px] text-foreground">{t('app.settings.notificationsEmail')}</span>
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(214,90,49)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <span className="text-[13px] text-foreground">{t('app.settings.notificationsInApp')}</span>
                <input
                  type="checkbox"
                  checked={notifInApp}
                  onChange={(e) => setNotifInApp(e.target.checked)}
                  className="h-4 w-4 accent-[rgb(214,90,49)]"
                />
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={savingPrefs}>
                {t('app.settings.savePreferences')}
          </Button>
        </SettingsCard>
      </form>

      <div>
        <SectionLabel>Equipo</SectionLabel>
        <SettingsCard className="mt-2 p-4">
          <p className="text-[14px] font-medium text-foreground">Miembros</p>
          <p className="mt-1 text-[12px] text-muted">
            {initial.memberCount != null ? `${initial.memberCount} miembro(s)` : '—'}
            {initial.myRole ? ` · Tu rol: ${initial.myRole}` : ''}
          </p>
          <p className="mt-3 text-[12px] text-muted">La gestión de miembros y roles está en Ops por ahora.</p>
        </SettingsCard>
      </div>

    </div>
  )

  const billingView = (
    <div>
      <SectionLabel>{t('app.settings.billing')}</SectionLabel>
      <p className="mt-1 text-[12px] text-muted">{t('app.settings.billingHint')}</p>
      <div className="mt-3">
        <Suspense>
          <BillingSettingsPanel />
        </Suspense>
      </div>
    </div>
  )

  const profileView = (
    <form onSubmit={savePersonal}>
      <SectionLabel>{t('app.settings.personal')}</SectionLabel>
      <SettingsCard className="mt-2 space-y-4 p-4">
        <Input
          label={t('app.settings.preferredName')}
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          required
          autoComplete="name"
        />
        <Button type="submit" variant="secondary" className="w-full" loading={savingPersonal}>
          {t('app.settings.savePersonal')}
        </Button>
      </SettingsCard>
    </form>
  )

  const businessView = (
    <form onSubmit={saveBusiness}>
      <SectionLabel>{t('app.settings.businessSection')}</SectionLabel>
      <SettingsCard className="mt-2 space-y-4 p-4">
        <Input
          label={t('app.settings.businessName')}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t('app.settings.businessType')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BUSINESS_TYPE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setBusinessTypeKey(key)
                  if (key !== 'other') setBusinessTypeOther('')
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] font-medium',
                  transitionColors,
                  businessTypeKey === key
                    ? 'border-accent/50 bg-accent-soft text-accent'
                    : 'border-border bg-surface-raised text-muted hover:border-accent/25 hover:text-foreground'
                )}
              >
                {t(`onboarding.types.${key}`)}
              </button>
            ))}
          </div>
          {businessTypeKey === 'other' && (
            <div className="mt-3">
              <OnboardingOtherField
                label={t('app.settings.otherTypeLabel')}
                placeholder={t('onboarding.otherPlaceholder.businessType')}
                value={businessTypeOther}
                onChange={setBusinessTypeOther}
              />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t('app.settings.currency')}
          </p>
          <SegmentedControl
            value={currency}
            onChange={setCurrency}
            options={currencyOptions}
            shape="rounded"
            size="md"
            fullWidth
            thumbVariant="accent"
          />
        </div>

        <div>
          <p className="text-[14px] font-medium text-foreground">{t('app.settings.inventory')}</p>
          <p className="mt-1 text-[12px] text-muted">{t('app.settings.inventoryHint')}</p>
          <div className="mt-3">
            <SegmentedControl
              value={usesStock ? 'on' : 'off'}
              onChange={(v) => setUsesStock(v === 'on')}
              options={stockOptions}
              shape="rounded"
              size="md"
              fullWidth
              thumbVariant="accent"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" loading={savingBusiness}>
          {t('app.settings.saveBusiness')}
        </Button>
      </SettingsCard>
    </form>
  )

  const securityView = (
    <div className="space-y-6">
      {initial.organizations.length > 1 && (
        <div>
          <SectionLabel>{t('app.settings.organization')}</SectionLabel>
          <SettingsCard className="mt-2 p-4">
            <TenantSwitcher
              orgs={initial.organizations}
              activeOrgId={initial.organizationId}
              currentOrgName={initial.businessName}
            />
          </SettingsCard>
        </div>
      )}

      <div>
        <SectionLabel>{t('app.settings.account')}</SectionLabel>
        <SettingsCard className="mt-2 divide-y divide-border">
          <div className="px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {t('app.settings.email')}
            </p>
            <p className="mt-1 text-[14px] text-foreground">{initial.email}</p>
            <p className="mt-1 text-[11px] text-muted">{t('app.settings.emailHint')}</p>
          </div>
          <div className="flex flex-col gap-1 px-2 py-2">
            <Link
              href="/privacidad"
              className={cn(
                'rounded-xl px-3 py-2.5 text-[13px] text-muted',
                transitionColors,
                'hover:bg-surface-raised hover:text-foreground'
              )}
            >
              {t('app.settings.privacy')}
            </Link>
            <Link
              href="/terminos"
              className={cn(
                'rounded-xl px-3 py-2.5 text-[13px] text-muted',
                transitionColors,
                'hover:bg-surface-raised hover:text-foreground'
              )}
            >
              {t('app.settings.terms')}
            </Link>
          </div>
        </SettingsCard>
      </div>

      <div>
        <SectionLabel>Seguridad</SectionLabel>
        <SettingsCard className="mt-2 p-2">
            <Link
              href={`/change-password?next=${encodeURIComponent('/ajustes')}`}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-foreground',
              transitionColors,
              'hover:bg-surface-raised'
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
              {t('app.settings.changePassword')}
          </Link>
        </SettingsCard>
      </div>

      <div>
        <SectionLabel>{t('app.settings.account')}</SectionLabel>
        <SettingsCard className="mt-2 p-2">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-destructive',
              transitionColors,
              'hover:bg-surface-raised disabled:opacity-50'
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {t('app.header.signOut')}
          </button>
        </SettingsCard>
      </div>
    </div>
  )

  const sections = [
    { id: 'preferencias', label: t('app.settings.navPreferences'), content: preferencesView },
    { id: 'facturacion', label: t('app.settings.billing'), content: billingView },
    { id: 'perfil', label: t('app.settings.navProfile'), content: profileView },
    { id: 'negocio', label: t('app.settings.navBusiness'), content: businessView },
    { id: 'seguridad', label: t('app.settings.navSecurity'), content: securityView },
  ]

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <SettingsSections sections={sections} defaultId="preferencias" />
    </div>
  )
}
