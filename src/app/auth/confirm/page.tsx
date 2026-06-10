'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from '@/components/i18n/LocaleProvider'

/**
 * Página dedicada para links de auth (recovery, confirmación).
 * Opcional: podés usar `/auth/confirm` como Site URL en Supabase.
 */
export default function AuthConfirmPage() {
  const router = useRouter()
  const { t } = useTranslations()

  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash

    const code = params.get('code')
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    if (code || tokenHash) {
      const dest = new URLSearchParams(window.location.search)
      if (!dest.has('next')) {
        dest.set('next', type === 'recovery' ? '/reset-password' : '/onboarding')
      }
      router.replace(`/auth/callback?${dest.toString()}`)
      return
    }

    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      router.replace(`/reset-password${hash}`)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        subscription.unsubscribe()
        router.replace('/reset-password')
      }
    })

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/hoy')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <p className="text-[14px] text-muted">{t('common.loading')}</p>
    </div>
  )
}
