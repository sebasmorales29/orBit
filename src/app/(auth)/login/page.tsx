'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthFormHeader } from '@/components/auth/AuthFormHeader'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { AuthUnderlineInput } from '@/components/auth/AuthUnderlineInput'
import { useAuthFocus } from '@/components/auth/use-auth-focus'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { mapLoginAuthError } from '@/lib/auth-validation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const { t } = useTranslations()
  const toast = useToast()
  const { focusField, passwordVisible, onFieldFocus, onFieldBlur, onPasswordVisibleChange } =
    useAuthFocus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('auth.signup.errorSupabaseConfig'))
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      toast.error(mapLoginAuthError(authError.message, t))
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getUser()
    const mustChange = Boolean(
      (data.user?.user_metadata as Record<string, unknown> | undefined)?.must_change_password
    )
    const next = sp.get('next') ?? '/hoy'
    router.push(mustChange ? `/change-password?next=${encodeURIComponent(next)}` : next)
    router.refresh()
  }

  return (
    <AuthSplitLayout focusField={focusField} passwordVisible={passwordVisible}>
      <AuthFormHeader subtitle={t('auth.login.subtitle')} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <AuthUnderlineInput
          label={t('common.email')}
          authField="email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFieldFocus={() => onFieldFocus('email')}
          onFieldBlur={onFieldBlur}
          required
          autoComplete="email"
        />
        <AuthUnderlineInput
          label={t('common.password')}
          authField="password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFieldFocus={() => onFieldFocus('password')}
          onFieldBlur={onFieldBlur}
          onPasswordVisibleChange={onPasswordVisibleChange}
          required
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[13px] text-muted transition-colors hover:text-foreground"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full py-3" loading={loading}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link
          href="/signup"
          className="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
