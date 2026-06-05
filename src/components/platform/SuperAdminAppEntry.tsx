import { getSuperAdminBridge } from '@/lib/platform/super-admin-bridge'
import { SuperAdminPlatformLink } from '@/components/platform/SuperAdminPlatformLink'

/** Botón flotante en la app del tenant — solo renderiza HTML para el super admin */
export async function SuperAdminAppEntry() {
  const bridge = await getSuperAdminBridge()
  if (!bridge) return null

  return (
    <SuperAdminPlatformLink
      href={bridge.opsHref}
      label="Platform"
      className="fixed bottom-[5.5rem] left-4 z-50 sm:bottom-24 sm:left-6"
    />
  )
}
