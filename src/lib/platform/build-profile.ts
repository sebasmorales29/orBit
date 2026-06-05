import type { OnboardingProfile } from '@/lib/onboarding/types'
import type { TenantPack } from '@/lib/platform/types'

export function buildOnboardingProfileFromPack(
  pack: TenantPack,
  ownerName: string,
  provisionedByEmail: string
): OnboardingProfile & { packId: string; provisionedAt: string; provisionedBy: string } {
  const d = pack.defaults
  return {
    preferredName: ownerName.trim(),
    businessTypeKey: d.businessTypeKey,
    teamSize: d.teamSize,
    salesChannels: d.salesChannels,
    mainChallenge: d.mainChallenge,
    successFocus: d.successFocus,
    orderVolume: d.orderVolume,
    completedAt: new Date().toISOString(),
    packId: pack.id,
    provisionedAt: new Date().toISOString(),
    provisionedBy: provisionedByEmail,
  }
}
