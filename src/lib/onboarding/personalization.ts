import { applyBusinessToLayout, resolveBusinessAdaptation } from '@/lib/business-context/resolve'
import { createDefaultLayout } from '@/lib/dashboard/defaults'
import { normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayoutV2, DashboardWidgetId } from '@/lib/dashboard/types'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { Organization } from '@/types/database'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function buildWelcomeBannerMessage(
  profile: OnboardingProfile | null,
  orgName: string,
  t: TranslateFn
): { title: string; body: string } {
  const name = profile?.preferredName?.trim()
  const title = name
    ? t('onboarding.welcomeBannerTitleNamed', { name, business: orgName })
    : t('onboarding.welcomeBannerTitle', { business: orgName })

  if (!profile) {
    return { title, body: t('onboarding.welcomeBannerDefault') }
  }

  const challenge =
    profile.mainChallenge === 'other' && profile.mainChallengeCustom
      ? profile.mainChallengeCustom
      : t(`onboarding.welcomeBannerChallenge.${profile.mainChallenge}`)
  const focus =
    profile.successFocus === 'other' && profile.successFocusCustom
      ? profile.successFocusCustom
      : t(`onboarding.welcomeBannerFocus.${profile.successFocus}`)
  const body = t('onboarding.welcomeBannerPersonal', {
    challenge,
    focus,
  })

  return { title, body }
}

/** Layout inicial según negocio + lo que más le importa al usuario. */
export function dashboardLayoutFromProfile(
  profile: OnboardingProfile,
  usesStock: boolean
): DashboardLayoutV2 {
  const stubOrg = {
    id: '',
    name: '',
    business_type: null,
    currency: 'CRC',
    uses_stock: usesStock,
    onboarding_completed: true,
    onboarding_profile: profile as unknown as Record<string, unknown>,
  } satisfies Organization

  const adaptation = resolveBusinessAdaptation(stubOrg)
  const base = createDefaultLayout(usesStock)
  const adapted = applyBusinessToLayout(base, adaptation, usesStock)
  return applyDashboardWidgetPrefs(adapted, profile.dashboardWidgets, usesStock)
}

const TOGGLEABLE_WIDGETS: DashboardWidgetId[] = [
  'greeting',
  'ai_assistant',
  'kpis',
  'priorities',
  'quick_actions',
  'pipeline',
  'recent_leads',
  'low_stock',
]

export function defaultWidgetPrefs(
  profile: OnboardingProfile,
  usesStock: boolean
): Partial<Record<DashboardWidgetId, boolean>> {
  const stubOrg = {
    id: '',
    name: '',
    business_type: null,
    currency: 'CRC' as const,
    uses_stock: usesStock,
    onboarding_completed: true,
    onboarding_profile: profile as unknown as Record<string, unknown>,
  } satisfies Organization

  const adaptation = resolveBusinessAdaptation(stubOrg)
  const base = createDefaultLayout(usesStock)
  const layout = applyBusinessToLayout(base, adaptation, usesStock)

  const prefs: Partial<Record<DashboardWidgetId, boolean>> = {}
  for (const id of TOGGLEABLE_WIDGETS) {
    if (id === 'low_stock' && !usesStock) {
      prefs[id] = false
      continue
    }
    let enabled = false
    for (const sec of layout.sections) {
      for (const row of sec.rows) {
        for (const cell of row.cells) {
          if (cell.widgetId === id && cell.enabled) enabled = true
        }
      }
    }
    prefs[id] = enabled
  }
  return prefs
}

export function applyDashboardWidgetPrefs(
  layout: DashboardLayoutV2,
  prefs: Partial<Record<DashboardWidgetId, boolean>> | undefined,
  usesStock: boolean
): DashboardLayoutV2 {
  if (!prefs || Object.keys(prefs).length === 0) return layout

  const v2 = normalizeLayout(layout, usesStock)
  const sections = v2.sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        const pref = prefs[cell.widgetId]
        if (pref === undefined) return cell
        if (cell.widgetId === 'greeting') return { ...cell, enabled: true }
        if (cell.widgetId === 'low_stock' && !usesStock) return { ...cell, enabled: false }
        return { ...cell, enabled: pref }
      }),
    })),
  }))

  return { version: 2, sections }
}

export function parseOnboardingProfile(raw: unknown): OnboardingProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (typeof p.preferredName !== 'string') return null
  return p as unknown as OnboardingProfile
}
