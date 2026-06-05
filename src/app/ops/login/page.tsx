import { OpsLoginGate } from '@/components/ops/OpsLoginGate'
import { getSuperAdminEmail } from '@/lib/platform/admin'
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/env'
import { OpsConfigNotice } from '@/components/ops/OpsConfigNotice'
import { appShellClass } from '@/components/layout/app-layout'

function safeOpsNext(next: string | string[] | undefined): string {
  const raw = typeof next === 'string' ? next : '/ops'
  if (!raw.startsWith('/ops')) return '/ops'
  return raw
}

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = safeOpsNext(params.next)
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

  return <OpsLoginGate nextHref={next} />
}
