import { AppOrgProvider } from '@/components/app/AppOrgProvider'
import { BusinessContextProvider } from '@/components/app/BusinessContextProvider'
import { TenantThemeProvider } from '@/components/app/TenantThemeProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCurrentOrganization } from '@/lib/org'
import { redirect } from 'next/navigation'

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

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations!inner(onboarding_completed)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/onboarding')

  const orgRow = membership.organizations as unknown as {
    onboarding_completed: boolean
    subscription_status?: string
  }
  if (!orgRow.onboarding_completed) redirect('/onboarding')

  const org = await getCurrentOrganization()
  if (!org) redirect('/onboarding')

  const subStatus = (org as { subscription_status?: string }).subscription_status
  if (subStatus === 'pending_payment') {
    redirect('/onboarding?step=8')
  }
  return (
    <AppOrgProvider org={org}>
      <TenantThemeProvider org={org}>
        <BusinessContextProvider org={org}>
          <div className="min-h-dvh pb-20">
            {children}
            <BottomNav />
          </div>
        </BusinessContextProvider>
      </TenantThemeProvider>
    </AppOrgProvider>
  )
}
