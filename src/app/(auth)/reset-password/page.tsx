'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthField } from '@/components/auth/AuthField'
import { AuthFormHeader } from '@/components/auth/AuthFormHeader'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { useAuthFocus } from '@/components/auth/use-auth-focus'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { PasswordRules } from '@/components/auth/PasswordRules'
import { checkPassword, isPasswordStrong } from '@/lib/auth-validation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()
  const {
    focusField,
    passwordVisible,
    onFieldFocus,
    onFieldBlur,
    onPasswordVisibleChange,
  } = useAuthFocus()

  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordChecks = useMemo(() => checkPassword(password), [password])
  const passwordOk = isPasswordStrong(passwordChecks)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordOk) {
      toast.error(t('auth.signup.errorPasswordRules'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.signup.errorPasswordMatch'))
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (authError) {
      toast.error(t('auth.resetPassword.error'))
      return
    }

    setDone(true)
    await supabase.auth.signOut()
  }

  const layout = (content: React.ReactNode) => (
    <AuthSplitLayout focusField={focusField} passwordVisible={passwordVisible}>
      {content}
    </AuthSplitLayout>
  )

  if (!ready) {
    return layout(<p className="text-[14px] text-muted">{t('common.loading')}</p>)
  }

  if (!hasSession) {
    return layout(
      <>
        <AuthFormHeader title={t('auth.resetPassword.title')} />
        <div className="mt-8 space-y-6">
          <p className="text-[14px] text-muted">{t('auth.resetPassword.sessionError')}</p>
          <Link
            href="/forgot-password"
            className="inline-block text-[13px] font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {t('auth.forgotPassword.submit')}
          </Link>
        </div>
      </>
    )
  }

  return layout(
    <>
      <AuthFormHeader
        title={t('auth.resetPassword.title')}
        subtitle={done ? undefined : t('auth.resetPassword.subtitle')}
      />

      {done ? (
        <div className="mt-8 space-y-6">
          <p className="text-[14px] leading-relaxed text-muted">{t('auth.resetPassword.success')}</p>
          <Button className="w-full py-3" onClick={() => router.push('/login')}>
            {t('auth.resetPassword.goToLogin')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <AuthField
              label={t('common.password')}
              type="password"
              authField="password"
              placeholder={t('auth.signup.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFieldFocus={() => onFieldFocus('password')}
              onFieldBlur={onFieldBlur}
              onPasswordVisibleChange={onPasswordVisibleChange}
              autoComplete="new-password"
              required
            />
            {password.length > 0 && <PasswordRules checks={passwordChecks} t={t} />}
          </div>

          <AuthField
            label={t('auth.signup.confirmPassword')}
            type="password"
            authField="password"
            placeholder={t('auth.signup.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFieldFocus={() => onFieldFocus('password')}
            onFieldBlur={onFieldBlur}
            onPasswordVisibleChange={onPasswordVisibleChange}
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            className="w-full py-3.5"
            loading={loading}
            disabled={!passwordOk || password !== confirmPassword}
          >
            {t('auth.resetPassword.submit')}
          </Button>
        </form>
      )}
    </>
  )
}
