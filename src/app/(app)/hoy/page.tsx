import { HoyPageView } from '@/components/hoy/HoyPageView'
import { loadHoyDashboardData } from '@/lib/dashboard/hoy-data'
import { parseDateRangeFromSearchParams } from '@/lib/dates/range'
import { periodLabelForLocale } from '@/lib/i18n/period-label'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/org'
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from '@/i18n'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HoyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const org = await getCurrentOrganization()
  if (!org) redirect('/onboarding')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const dateRange = parseDateRangeFromSearchParams(sp)

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const dashboardData = await loadHoyDashboardData(
    supabase,
    org,
    user,
    dateRange,
    (key) => periodLabelForLocale(locale, key)
  )

  return <HoyPageView data={dashboardData} />
}
