'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useTheme } from '@/components/theme/ThemeProvider'
import { cn } from '@/lib/utils'
import { SettingsSections } from '@/components/settings/SettingsSections'
import { useTranslations } from '@/components/i18n/LocaleProvider'

const OPS_TZ_KEY = 'orbit-ops-timezone'
const OPS_REGION_KEY = 'orbit-ops-region'
const OPS_NOTIF_EMAIL_KEY = 'orbit-ops-notif-email'
const OPS_NOTIF_INAPP_KEY = 'orbit-ops-notif-inapp'

function readBool(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

function readStr(key: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) ?? fallback
}

export function OpsSettingsClient() {
  return (
    <Suspense>
      <OpsSettingsClientInner />
    </Suspense>
  )
}

function OpsSettingsClientInner() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslations()

  const [timezone, setTimezone] = useState('America/Costa_Rica')
  const [region, setRegion] = useState('es-CR')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifInApp, setNotifInApp] = useState(true)

  useEffect(() => {
    setTimezone(readStr(OPS_TZ_KEY, 'America/Costa_Rica'))
    setRegion(readStr(OPS_REGION_KEY, 'es-CR'))
    setNotifEmail(readBool(OPS_NOTIF_EMAIL_KEY, true))
    setNotifInApp(readBool(OPS_NOTIF_INAPP_KEY, true))
  }, [])

  useEffect(() => {
    localStorage.setItem(OPS_TZ_KEY, timezone)
  }, [timezone])
  useEffect(() => {
    localStorage.setItem(OPS_REGION_KEY, region)
  }, [region])
  useEffect(() => {
    localStorage.setItem(OPS_NOTIF_EMAIL_KEY, String(notifEmail))
  }, [notifEmail])
  useEffect(() => {
    localStorage.setItem(OPS_NOTIF_INAPP_KEY, String(notifInApp))
  }, [notifInApp])

  const themeOptions = useMemo(
    () => [
      { id: 'system' as const, label: t('app.settings.themeAuto') },
      { id: 'light' as const, label: t('app.settings.themeLight') },
      { id: 'dark' as const, label: t('app.settings.themeDark') },
    ],
    [t]
  )

  const preferencesView = (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-[14px] font-medium text-foreground">{t('app.settings.preferences')}</h2>

      <div className="mt-4 grid gap-4">
          <div className="rounded-2xl border border-border bg-surface-raised p-4">
            <p className="text-[14px] font-medium text-foreground">{t('app.settings.language')}</p>
            <p className="mt-1 text-[12px] text-muted">{t('app.settings.languageHint')}</p>
            <div className="mt-3">
              <LanguageToggle className="border border-border-subtle bg-surface shadow-none dark:bg-surface-card" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-raised p-4">
            <p className="text-[14px] font-medium text-foreground">{t('app.settings.theme')}</p>
            <p className="mt-1 text-[12px] text-muted">{t('app.settings.themeHint')}</p>
            <div className="mt-3">
              <SegmentedControl
                value={theme}
                onChange={setTheme}
                options={themeOptions}
                shape="rounded"
                size="md"
                fullWidth
                thumbVariant="accent"
                ariaLabel="Tema"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('app.settings.timezone')}
              </p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[14px]"
              >
                <option value="America/Costa_Rica">Costa Rica (GMT-6)</option>
                <option value="America/Mexico_City">CDMX</option>
                <option value="America/Guatemala">Guatemala</option>
                <option value="America/Bogota">Bogotá</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t('app.settings.region')}
              </p>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[14px]"
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
      </div>
    </section>
  )

  const securityView = (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-[14px] font-medium text-foreground">{t('app.settings.navSecurity')}</h2>
      <div className="mt-3">
        <Link
          href={`/change-password?next=${encodeURIComponent('/ops/settings')}`}
          className={cn(
            'flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 text-[13px] font-medium text-foreground',
            'hover:bg-surface-hover'
          )}
        >
          <ShieldCheck className="h-4 w-4 text-muted" strokeWidth={1.5} />
            {t('app.settings.changePassword')}
        </Link>
      </div>
    </section>
  )

  const teamView = (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-[14px] font-medium text-foreground">{t('app.settings.team')}</h2>
      <p className="mt-1 text-[12px] text-muted">
        La gestión del equipo vive en <span className="text-foreground">Tenants</span> y{' '}
        <span className="text-foreground">Usuarios</span>.
      </p>
    </section>
  )

  const billingView = (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-[14px] font-medium text-foreground">{t('app.settings.billing')}</h2>
      <p className="mt-1 text-[12px] text-muted">
        {t('app.settings.billingHint')}
      </p>
    </section>
  )

  const sections = [
    { id: 'preferencias', label: t('app.settings.navPreferences'), content: preferencesView },
    { id: 'seguridad', label: t('app.settings.navSecurity'), content: securityView },
    { id: 'equipo', label: t('app.settings.team'), content: teamView },
    { id: 'facturacion', label: t('app.settings.billing'), content: billingView },
  ]

  return <SettingsSections sections={sections} defaultId="preferencias" />
}

