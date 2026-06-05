import { normalizeLayout } from '@/lib/dashboard/layout-v2'
import type { DashboardLayout, DashboardLayoutV2, DashboardWidgetId } from '@/lib/dashboard/types'
import { parseOnboardingProfile } from '@/lib/onboarding/personalization'
import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { Organization } from '@/types/database'
import type {
  AppNavId,
  BusinessAdaptation,
  BusinessVertical,
  QuickActionId,
} from '@/lib/business-context/types'

const VERTICAL_KEYS: BusinessVertical[] = [
  'apparel',
  'beauty',
  'food',
  'crafts',
  'services',
  'barber',
  'perfumes',
  'jewelry',
  'retail',
  'other',
]

function asVertical(key?: string | null): BusinessVertical {
  if (key && VERTICAL_KEYS.includes(key as BusinessVertical)) {
    return key as BusinessVertical
  }
  return 'other'
}

function navOrderFor(
  vertical: BusinessVertical,
  profile: OnboardingProfile | null,
  usesStock: boolean
): AppNavId[] {
  const base: AppNavId[] = usesStock
    ? ['hoy', 'ventas', 'pedidos', 'stock']
    : ['hoy', 'ventas', 'pedidos']

  if (!profile) return base

  if (profile.mainChallenge === 'stock' && usesStock) {
    return ['hoy', 'stock', 'pedidos', 'ventas']
  }
  if (profile.mainChallenge === 'orders') {
    return ['hoy', 'pedidos', 'ventas', ...(usesStock ? ['stock' as const] : [])]
  }
  if (profile.mainChallenge === 'follow_ups') {
    return ['hoy', 'ventas', 'pedidos', ...(usesStock ? ['stock' as const] : [])]
  }
  if (vertical === 'food' && usesStock) {
    return ['hoy', 'pedidos', 'stock', 'ventas']
  }
  if (vertical === 'services' || vertical === 'barber') {
    return ['hoy', 'ventas', 'pedidos']
  }
  if (vertical === 'perfumes' || vertical === 'jewelry' || vertical === 'retail') {
    return usesStock
      ? ['hoy', 'ventas', 'stock', 'pedidos']
      : ['hoy', 'ventas', 'pedidos']
  }
  return base
}

function quickActionsFor(
  vertical: BusinessVertical,
  profile: OnboardingProfile | null,
  usesStock: boolean
): { actions: QuickActionId[]; primary: QuickActionId } {
  let actions: QuickActionId[] = ['newLead', 'newOrder', 'sales']
  if (usesStock) actions.push('stock')

  let primary: QuickActionId = 'newLead'

  if (!profile) {
    return { actions, primary }
  }

  switch (profile.mainChallenge) {
    case 'orders':
      primary = 'newOrder'
      actions = ['newOrder', 'newLead', 'sales', ...(usesStock ? ['stock' as const] : [])]
      break
    case 'stock':
      primary = usesStock ? 'stock' : 'newOrder'
      actions = usesStock
        ? ['stock', 'newOrder', 'newLead', 'sales']
        : ['newOrder', 'newLead', 'sales']
      break
    case 'payments':
      primary = 'sales'
      actions = ['sales', 'newOrder', 'newLead', ...(usesStock ? ['stock' as const] : [])]
      break
    case 'follow_ups':
      primary = 'newLead'
      actions = ['newLead', 'sales', 'newOrder', ...(usesStock ? ['stock' as const] : [])]
      break
    case 'everything':
      primary = 'newLead'
      break
  }

  if (vertical === 'food') {
    primary = 'newOrder'
    actions = ['newOrder', ...(usesStock ? ['stock' as const] : []), 'newLead', 'sales']
  }
  if (vertical === 'services' || vertical === 'barber') {
    primary = 'newLead'
    actions = ['newLead', 'newOrder', 'sales']
  }

  if (vertical === 'perfumes' || vertical === 'jewelry') {
    primary = 'newOrder'
    actions = ['newOrder', 'newLead', 'sales', ...(usesStock ? ['stock' as const] : [])]
  }

  if (vertical === 'retail') {
    primary = usesStock ? 'stock' : 'newOrder'
    actions = usesStock
      ? ['newOrder', 'stock', 'newLead', 'sales']
      : ['newOrder', 'newLead', 'sales']
  }

  return { actions, primary }
}

function widgetOrderFor(
  vertical: BusinessVertical,
  profile: OnboardingProfile | null,
  usesStock: boolean
): DashboardWidgetId[] {
  if (!profile) {
    return [
      'greeting',
      'ai_assistant',
      'kpis',
      'priorities',
      'quick_actions',
      'pipeline',
      ...(usesStock ? ['low_stock' as const] : []),
      'recent_leads',
    ]
  }

  const challenge = profile.mainChallenge

  if (vertical === 'food') {
    return [
      'greeting',
      'ai_assistant',
      'priorities',
      ...(usesStock ? ['low_stock' as const] : []),
      'kpis',
      'quick_actions',
      'pipeline',
      'recent_leads',
    ]
  }

  if (vertical === 'services' || vertical === 'barber') {
    return [
      'greeting',
      'ai_assistant',
      'priorities',
      'pipeline',
      'recent_leads',
      'quick_actions',
      'kpis',
      ...(usesStock ? ['low_stock' as const] : []),
    ]
  }

  if (vertical === 'perfumes' || vertical === 'jewelry' || vertical === 'retail') {
    return [
      'greeting',
      'ai_assistant',
      'kpis',
      'priorities',
      'quick_actions',
      ...(usesStock ? ['low_stock' as const] : []),
      'pipeline',
      'recent_leads',
    ]
  }

  if (challenge === 'follow_ups') {
    return [
      'greeting',
      'ai_assistant',
      'priorities',
      'recent_leads',
      'pipeline',
      'quick_actions',
      'kpis',
      ...(usesStock ? ['low_stock' as const] : []),
    ]
  }

  if (challenge === 'orders') {
    return [
      'greeting',
      'ai_assistant',
      'priorities',
      'kpis',
      'quick_actions',
      'pipeline',
      ...(usesStock ? ['low_stock' as const] : []),
      'recent_leads',
    ]
  }

  if (challenge === 'stock' && usesStock) {
    return [
      'greeting',
      'ai_assistant',
      'low_stock',
      'priorities',
      'kpis',
      'quick_actions',
      'pipeline',
      'recent_leads',
    ]
  }

  if (challenge === 'payments') {
    return [
      'greeting',
      'ai_assistant',
      'kpis',
      'priorities',
      'quick_actions',
      'pipeline',
      'recent_leads',
      ...(usesStock ? ['low_stock' as const] : []),
    ]
  }

  return [
    'greeting',
    'ai_assistant',
    'kpis',
    'priorities',
    'quick_actions',
    'pipeline',
    'recent_leads',
    ...(usesStock ? ['low_stock' as const] : []),
  ]
}

function insightKeyFor(vertical: BusinessVertical, profile: OnboardingProfile | null): string {
  if (profile) {
    return `app.adapt.insights.${vertical}.${profile.successFocus}`
  }
  return `app.adapt.insights.${vertical}.default`
}

function panelSubtitleKeyFor(vertical: BusinessVertical, profile: OnboardingProfile | null): string {
  if (profile) {
    return `app.adapt.panel.${vertical}.${profile.mainChallenge}`
  }
  return `app.adapt.panel.${vertical}.default`
}

export function resolveBusinessAdaptation(org: Organization): BusinessAdaptation {
  const profile = parseOnboardingProfile(org.onboarding_profile)
  const vertical = profile?.businessTypeKey
    ? asVertical(profile.businessTypeKey)
    : asVertical(null)

  const { actions, primary } = quickActionsFor(vertical, profile, org.uses_stock)

  return {
    vertical,
    profile,
    navOrder: navOrderFor(vertical, profile, org.uses_stock),
    quickActions: actions,
    primaryQuickAction: primary,
    widgetOrder: widgetOrderFor(vertical, profile, org.uses_stock),
    labelScope: vertical,
    dailyInsightKey: insightKeyFor(vertical, profile),
    panelSubtitleKey: panelSubtitleKeyFor(vertical, profile),
  }
}

/** Sugiere widgets activos según perfil de negocio (sin reordenar el layout del usuario). */
function businessEnabledHints(
  adaptation: BusinessAdaptation,
  usesStock: boolean
): Map<DashboardWidgetId, boolean> {
  const enabledMap = new Map<DashboardWidgetId, boolean>()
  const profile = adaptation.profile

  if (profile) {
    if (profile.mainChallenge === 'follow_ups' || profile.mainChallenge === 'everything') {
      enabledMap.set('recent_leads', true)
      enabledMap.set('priorities', true)
    }
    if (profile.mainChallenge === 'orders' || profile.mainChallenge === 'everything') {
      enabledMap.set('pipeline', true)
    }
    if (
      (profile.mainChallenge === 'stock' || profile.mainChallenge === 'everything') &&
      usesStock
    ) {
      enabledMap.set('low_stock', true)
    }
    if (profile.mainChallenge === 'payments') {
      enabledMap.set('kpis', true)
    }
    if (profile.successFocus === 'professional') {
      enabledMap.set('pipeline', true)
      enabledMap.set('kpis', true)
    }
    if (adaptation.vertical === 'food' && usesStock) {
      enabledMap.set('low_stock', true)
      enabledMap.set('priorities', true)
    }
    if (adaptation.vertical === 'services') {
      enabledMap.set('recent_leads', true)
      enabledMap.set('pipeline', true)
      if (!usesStock) enabledMap.set('low_stock', false)
    }
  }

  if (!usesStock) enabledMap.set('low_stock', false)
  enabledMap.set('greeting', true)
  enabledMap.set('ai_assistant', true)

  return enabledMap
}

/** Aplica hints de negocio sobre celdas ya colocadas (respeta layout guardado). */
export function applyBusinessToLayout(
  layout: DashboardLayout,
  adaptation: BusinessAdaptation,
  usesStock: boolean
): DashboardLayoutV2 {
  const v2 = normalizeLayout(layout, usesStock)
  const hints = businessEnabledHints(adaptation, usesStock)

  const sections = v2.sections.map((sec) => ({
    ...sec,
    rows: sec.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        const hint = hints.get(cell.widgetId)
        if (hint === undefined) return cell
        if (cell.widgetId === 'greeting') return { ...cell, enabled: true }
        return { ...cell, enabled: cell.enabled || hint }
      }),
    })),
  }))

  return { version: 2, sections }
}
