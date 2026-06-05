import type { BrandPresetId, TenantBrandTheme } from '@/lib/onboarding/brand-theme'
import type { SubscriptionPlanId } from '@/lib/onboarding/plans'
import type { DashboardWidgetId } from '@/lib/dashboard/types'

export type TeamSize = 'solo' | 'small' | 'growing'
export type SalesChannel =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'physical'
  | 'website'
  | 'other'
export type MainChallenge =
  | 'follow_ups'
  | 'orders'
  | 'stock'
  | 'payments'
  | 'everything'
  | 'other'
export type SuccessFocus = 'calm' | 'sales' | 'organized' | 'professional' | 'other'
export type OrderVolume = 'light' | 'steady' | 'busy' | 'other'

export interface OnboardingProfile {
  preferredName: string
  businessTypeKey: string
  /** Texto libre cuando businessTypeKey === 'other' */
  businessTypeCustom?: string
  teamSize: TeamSize
  salesChannels: SalesChannel[]
  salesChannelCustom?: string
  mainChallenge: MainChallenge
  mainChallengeCustom?: string
  successFocus: SuccessFocus
  successFocusCustom?: string
  orderVolume: OrderVolume
  orderVolumeCustom?: string
  completedAt: string

  /** Plan elegido en onboarding (self-service) */
  selectedPlan?: SubscriptionPlanId
  /** Correo del dueño de la suscripción (tracking ops) */
  ownerEmail?: string
  /** Marca visual del tenant */
  brandTheme?: TenantBrandTheme
  /** Widgets que el usuario quiere en su panel inicial */
  dashboardWidgets?: Partial<Record<DashboardWidgetId, boolean>>

  /** Preferencias del tenant (no afectan la lógica de onboarding) */
  settings?: {
    timezone?: string
    region?: string
    notifications?: {
      email?: boolean
      inApp?: boolean
    }
  }
}

export type { BrandPresetId, TenantBrandTheme, SubscriptionPlanId }
