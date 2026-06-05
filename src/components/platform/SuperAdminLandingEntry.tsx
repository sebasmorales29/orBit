import { getSuperAdminBridge } from '@/lib/platform/super-admin-bridge'
import { SuperAdminPlatformLink } from '@/components/platform/SuperAdminPlatformLink'

export async function SuperAdminLandingEntry() {
  const bridge = await getSuperAdminBridge()
  if (!bridge) return null

  return (
    <SuperAdminPlatformLink
      href={bridge.opsHref}
      label="Platform"
      variant="pill"
    />
  )
}
