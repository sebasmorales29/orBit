import type {
  MainChallenge,
  OnboardingProfile,
  OrderVolume,
  SalesChannel,
  SuccessFocus,
  TeamSize,
} from '@/lib/onboarding/types'
import type { CurrencyCode } from '@/types/database'

export interface TenantPackDefaults {
  businessTypeKey: string
  businessTypeLabel: string
  currency: CurrencyCode
  usesStock: boolean
  teamSize: TeamSize
  salesChannels: SalesChannel[]
  mainChallenge: MainChallenge
  successFocus: SuccessFocus
  orderVolume: OrderVolume
}

export interface TenantPack {
  id: string
  label: string
  description: string
  defaults: TenantPackDefaults
}

export interface ProvisionTenantInput {
  packId: string
  businessName: string
  ownerEmail: string
  ownerName: string
  currency?: CurrencyCode
  usesStock?: boolean
  slug?: string
  maxMembers?: number | null
  allowedEmailDomains?: string[]
  isDemo?: boolean
  publicUrlPublished?: boolean
  platformStatus?: PlatformStatus
  planTier?: PlanTier
}

export type ProvisionTenantResult =
  | {
      ok: true
      organizationId: string
      ownerUserId: string
      invited: boolean
    }
  | {
      ok: false
      code:
        | 'NOT_AUTHORIZED'
        | 'ADMIN_NOT_CONFIGURED'
        | 'INVALID_PACK'
        | 'INVALID_INPUT'
        | 'USER_HAS_ORG'
        | 'INVITE_FAILED'
        | 'PROVISION_FAILED'
      message: string
    }

export type PlatformStatus = 'trial' | 'active' | 'suspended'
export type PlanTier = 'trial' | 'starter' | 'pro' | 'enterprise'

export interface TenantListRow {
  id: string
  name: string
  business_type: string | null
  currency: CurrencyCode
  uses_stock: boolean
  onboarding_completed: boolean
  created_at: string
  packId: string | null
  ownerEmail: string | null
  ownerName: string | null
  memberCount: number
  platform_status: PlatformStatus
  plan_tier: PlanTier
  monthly_fee_cents: number
  slug: string | null
  is_demo: boolean
  public_url_published: boolean
  provisioned_source: 'self_service' | 'ops'
  selected_plan: string | null
}

export type TenantListResult =
  | { ok: true; tenants: TenantListRow[] }
  | { ok: false; code: 'NOT_AUTHORIZED' | 'ADMIN_NOT_CONFIGURED'; message: string }
