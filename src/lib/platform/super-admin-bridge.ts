import {
  getSessionUserEmail,
  getSessionUserId,
  isSuperAdminEmail,
} from '@/lib/platform/admin'
import {
  getOpsAbsoluteHref,
  getPublicSiteAbsoluteHref,
  hostSplitEnabled,
} from '@/lib/platform/ops-host'

export type SuperAdminBridge = {
  opsHref: string
  /** Landing pública (sitio public-facing). */
  publicAppHref: string
}

/** Puente solo para el super admin: consola /ops ↔ sitio público */
export async function getSuperAdminBridge(): Promise<SuperAdminBridge | null> {
  if (hostSplitEnabled()) return null

  const email = await getSessionUserEmail()
  if (!isSuperAdminEmail(email)) return null

  const userId = await getSessionUserId()
  if (!userId) return null

  return {
    opsHref: getOpsAbsoluteHref(),
    publicAppHref: getPublicSiteAbsoluteHref(),
  }
}
