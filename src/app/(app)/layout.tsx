import { AppOrgProvider } from '@/components/app/AppOrgProvider'
import { BusinessContextProvider } from '@/components/app/BusinessContextProvider'
import { TenantThemeProvider } from '@/components/app/TenantThemeProvider'
import { TenantPickerGate } from '@/components/app/TenantPickerGate'
import { BottomNav } from '@/components/layout/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { ACTIVE_ORG_COOKIE, getCurrentOrganization } from '@/lib/org'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isSupabaseConfigured()) redirect('/')

  const supabase = await createClient()
  if (!supabase) redirect('/')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Si el usuario está desactivado (banned), no puede usar la app.
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
    redirect('/disabled')
  }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, organizations!inner(id, name, onboarding_completed)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null

  const orgs = (memberships ?? [])
    .map((m) => {
      const o = m.organizations as unknown as {
        id: string
        name: string
        onboarding_completed: boolean
      } | null
      return o ? { id: o.id, name: o.name, onboarding_completed: o.onboarding_completed } : null
    })
    .filter(Boolean) as { id: string; name: string; onboarding_completed: boolean }[]

  // Si alguna org todavía no terminó onboarding, mandamos a onboarding (flujo actual).
  // Esto mantiene el comportamiento existente sin mezclar selección de tenant en medio del wizard.
  if (orgs.some((o) => !o.onboarding_completed)) redirect('/onboarding')

  const org = await getCurrentOrganization()
  if (!org) redirect('/onboarding')

  const subStatus = (org as { subscription_status?: string }).subscription_status
  if (subStatus === 'pending_payment') {
    redirect('/onboarding?step=8')
  }
  return (
    <>
      <TenantPickerGate
        orgs={orgs.map(({ id, name }) => ({ id, name }))}
        activeOrgId={activeOrgId}
      />
      <AppOrgProvider org={org} organizations={orgs.map(({ id, name }) => ({ id, name }))}>
        <TenantThemeProvider org={org}>
          <BusinessContextProvider org={org}>
            <div className="min-h-dvh pb-20">
              {children}
              <BottomNav />
            </div>
          </BusinessContextProvider>
        </TenantThemeProvider>
      </AppOrgProvider>
    </>
  )
}
