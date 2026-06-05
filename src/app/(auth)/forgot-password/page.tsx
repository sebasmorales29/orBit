'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthField } from '@/components/auth/AuthField'
import { AuthFormHeader } from '@/components/auth/AuthFormHeader'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { useAuthFocus } from '@/components/auth/use-auth-focus'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'
import { isValidEmail } from '@/lib/auth-validation'

export default function ForgotPasswordPage() {
  const { t } = useTranslations()
  const toast = useToast()
  const { focusField, passwordVisible, onFieldFocus, onFieldBlur } = useAuthFocus()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      toast.error(t('auth.signup.errorInvalidEmail'))
      return
    }

    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    setLoading(false)

    if (authError) {
      toast.error(t('auth.forgotPassword.error'))
      return
    }

    setSent(true)
  }

  return (
    <AuthSplitLayout focusField={focusField} passwordVisible={passwordVisible}>
      <AuthFormHeader
        title={t('auth.forgotPassword.title')}
        subtitle={sent ? undefined : t('auth.forgotPassword.subtitle')}
      />

      {sent ? (
        <div className="mt-8 space-y-6">
          <p className="text-[14px] leading-relaxed text-muted">{t('auth.forgotPassword.success')}</p>
          <Link
            href="/login"
            className="inline-block text-[13px] font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <AuthField
            label={t('common.email')}
            type="email"
            authField="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFieldFocus={() => onFieldFocus('email')}
            onFieldBlur={onFieldBlur}
            required
            autoComplete="email"
          />

          <Button type="submit" className="w-full py-3" loading={loading}>
            {t('auth.forgotPassword.submit')}
          </Button>

          <p className="text-center text-[13px] text-muted">
            <Link
              href="/login"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  )
}
