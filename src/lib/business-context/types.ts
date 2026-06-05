import type { DashboardWidgetId } from '@/lib/dashboard/types'
import type { OnboardingProfile } from '@/lib/onboarding/types'

export type BusinessVertical =
  | 'apparel'
  | 'beauty'
  | 'food'
  | 'crafts'
  | 'services'
  | 'barber'
  | 'perfumes'
  | 'jewelry'
  | 'retail'
  | 'other'

export type AppNavId = 'hoy' | 'ventas' | 'pedidos' | 'stock'
export type QuickActionId = 'newLead' | 'newOrder' | 'sales' | 'stock'

export interface BusinessAdaptation {
  vertical: BusinessVertical
  profile: OnboardingProfile | null
  /** Orden de pestañas inferiores */
  navOrder: AppNavId[]
  /** Accesos directos del dashboard (orden + cuál es primario) */
  quickActions: QuickActionId[]
  primaryQuickAction: QuickActionId
  /** Orden sugerido de widgets cuando no hay layout guardado personalizado */
  widgetOrder: DashboardWidgetId[]
  /** Claves i18n bajo app.adapt.labels.{vertical} */
  labelScope: BusinessVertical
  /** Clave i18n del mensaje guía del día */
  dailyInsightKey: string
  /** Clave i18n del subtítulo del panel */
  panelSubtitleKey: string
}
