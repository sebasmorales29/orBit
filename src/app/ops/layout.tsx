import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { appShellClass } from '@/components/layout/app-layout'
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const superEmail = getSuperAdminEmail()
  const opsReady =
    Boolean(superEmail) && isSupabaseConfigured() && isServiceRoleConfigured()

  if (!opsReady) {
    return (
      <div className="min-h-dvh bg-page px-4 py-16">
        <div className={appShellClass}>
          <OpsConfigNotice />
        </div>
      </div>
    )
  }

  // /ops/login redirige al login público; la consola vive en (console)/layout.
  return (
    <div className="min-h-dvh bg-page">
      <main className={`${appShellClass} py-8`}>
        {children}
      </main>
    </div>
  )
}
