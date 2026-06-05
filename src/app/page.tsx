import { redirect } from 'next/navigation'
import { isSuperAdminEmail } from '@/lib/platform/admin'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingHow } from '@/components/landing/LandingHow'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingFAQ } from '@/components/landing/LandingFAQ'
import { LandingContact } from '@/components/landing/LandingContact'
import { LandingFooter } from '@/components/landing/LandingFooter'
export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && !isSuperAdminEmail(user.email)) {
      redirect('/hoy')
    }
  }

  return (
    <div className="min-h-dvh">
      <LandingNavbar adminSlot={null} />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHow />
        <LandingPricing />
        <LandingFAQ />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  )
}
