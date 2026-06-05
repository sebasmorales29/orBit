'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthField } from '@/components/auth/AuthField'
import { AuthFormHeader } from '@/components/auth/AuthFormHeader'
import { PasswordRules } from '@/components/auth/PasswordRules'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import type { AuthFocusField } from '@/components/auth/auth-scene'
import {
  checkPassword,
  isPasswordStrong,
  isValidEmail,
  mapSignupAuthError,
} from '@/lib/auth-validation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

interface SignupFormProps {
  onFieldFocus?: (field: AuthFocusField) => void
  onFieldBlur?: () => void
  onPasswordVisibleChange?: (visible: boolean) => void
}

export function SignupForm({
  onFieldFocus,
  onFieldBlur,
  onPasswordVisibleChange,
}: SignupFormProps) {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false)
  const submittingRef = useRef(false)

  const passwordChecks = useMemo(() => checkPassword(password), [password])
  const passwordOk = isPasswordStrong(passwordChecks)

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {}
    if (touched.fullName && fullName.trim().length < 2) {
      errs.fullName = t('auth.signup.errorName')
    }
    if (touched.email && email && !isValidEmail(email)) {
      errs.email = t('auth.signup.errorInvalidEmail')
    }
    if (touched.password && password && !passwordOk) {
      errs.password = t('auth.signup.errorPasswordRules')
    }
    if (touched.confirmPassword && confirmPassword && confirmPassword !== password) {
      errs.confirmPassword = t('auth.signup.errorPasswordMatch')
    }
    return errs
  }, [touched, fullName, email, password, confirmPassword, passwordOk, t])

  const canSubmit =
    fullName.trim().length >= 2 &&
    isValidEmail(email) &&
    passwordOk &&
    confirmPassword === password &&
    acceptedTerms

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function showSignupError(message: string) {
    const keepInline =
      message === t('auth.signup.errorEmailTaken') ||
      message === t('auth.signup.errorRateLimit')
    if (keepInline) setError(message)
    else toast.error(message)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    if (!canSubmit || submittingRef.current) return

    submittingRef.current = true
    setError('')
    setLoading(true)

    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      showSignupError(err instanceof Error ? err.message : t('auth.signup.errorSupabaseConfig'))
      setLoading(false)
      submittingRef.current = false
      return
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName.trim(),
        },
      },
    })

    if (authError) {
      showSignupError(mapSignupAuthError(authError.message, t, authError.status))
      setLoading(false)
      submittingRef.current = false
      return
    }

    // Correo ya registrado (Supabase no devuelve error explícito por privacidad)
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      showSignupError(t('auth.signup.errorEmailTaken'))
      setLoading(false)
      submittingRef.current = false
      return
    }

    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    // Confirmación por correo pendiente: no llamar signIn (gasta cupo y falla igual)
    const needsEmailConfirm =
      data.user && !data.user.email_confirmed_at && !data.session

    if (needsEmailConfirm) {
      setAwaitingEmailConfirmation(true)
      setLoading(false)
      submittingRef.current = false
      return
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      if (signInError.status === 429) {
        showSignupError(mapSignupAuthError(signInError.message, t, signInError.status))
      } else if (
        signInError.message.toLowerCase().includes('email not confirmed') ||
        signInError.message.toLowerCase().includes('not verified')
      ) {
        setAwaitingEmailConfirmation(true)
      } else {
        setAwaitingEmailConfirmation(true)
      }
      setLoading(false)
      submittingRef.current = false
      return
    }

    if (signInData.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    setAwaitingEmailConfirmation(true)
    setLoading(false)
    submittingRef.current = false
  }

  const trialItems = [
    t('auth.signup.trial1'),
    t('auth.signup.trial2'),
    t('auth.signup.trial3'),
  ]

  return (
    <>
      <AuthFormHeader
        title={
          awaitingEmailConfirmation ? t('auth.signup.checkEmailTitle') : t('auth.signup.title')
        }
        subtitle={awaitingEmailConfirmation ? undefined : t('auth.signup.subtitle')}
      />

      {awaitingEmailConfirmation ? (
        <div className="mt-8 space-y-6">
          <p className="text-[14px] leading-relaxed text-muted">
            {t('auth.signup.checkEmailBody')}
          </p>
          <p className="text-[13px] text-muted">
            {t('auth.signup.checkEmailHint')}{' '}
            <Link
              href="/login"
              className="font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {t('auth.signup.checkEmailLogin')}
            </Link>
          </p>
        </div>
      ) : (
        <>
      <ul className="mt-6 space-y-2.5 border-b border-border pb-6">
        {trialItems.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <AuthField
          label={t('auth.signup.fullName')}
          placeholder={t('auth.signup.fullNamePlaceholder')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => markTouched('fullName')}
          fieldError={fieldErrors.fullName}
          autoComplete="name"
          required
        />

        <AuthField
          label={t('common.email')}
          type="email"
          authField="email"
          placeholder={t('auth.signup.emailPlaceholder')}
          hint={t('auth.signup.emailHint')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFieldFocus={() => onFieldFocus?.('email')}
          onFieldBlur={() => {
            markTouched('email')
            onFieldBlur?.()
          }}
          fieldError={fieldErrors.email}
          autoComplete="email"
          required
        />

        <div>
          <AuthField
            label={t('common.password')}
            type="password"
            authField="password"
            placeholder={t('auth.signup.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFieldFocus={() => onFieldFocus?.('password')}
            onFieldBlur={() => {
              markTouched('password')
              onFieldBlur?.()
            }}
            onPasswordVisibleChange={onPasswordVisibleChange}
            fieldError={fieldErrors.password}
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
          onFieldFocus={() => onFieldFocus?.('password')}
          onFieldBlur={() => {
            markTouched('confirmPassword')
            onFieldBlur?.()
          }}
          onPasswordVisibleChange={onPasswordVisibleChange}
          fieldError={fieldErrors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-card/40 px-3 py-3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[var(--color-accent)]"
          />
          <span className="text-[12px] leading-relaxed text-muted">
            {t('auth.signup.termsPrefix')}{' '}
            <Link
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t('auth.signup.termsLink')}
            </Link>{' '}
            {t('auth.signup.termsAnd')}{' '}
            <Link
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t('auth.signup.privacyLink')}
            </Link>
          </span>
        </label>

        {error && (
          <div
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-500"
            role="alert"
          >
            <p>{error}</p>
            {(error === t('auth.signup.errorRateLimit') ||
              error === t('auth.signup.errorEmailTaken')) && (
              <p className="mt-2 text-[12px] leading-relaxed">
                <Link
                  href="/login"
                  className="font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  {t('auth.signup.signIn')}
                </Link>
                {error === t('auth.signup.errorRateLimit') && (
                  <>
                    {' '}
                    ·{' '}
                    <button
                      type="button"
                      className="font-semibold text-foreground underline-offset-2 hover:underline"
                      onClick={() => {
                        setError('')
                        setAwaitingEmailConfirmation(true)
                      }}
                    >
                      {t('auth.signup.checkEmailMaybeSent')}
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full py-3.5"
          loading={loading}
          disabled={!canSubmit || loading}
        >
          {t('auth.signup.submit')}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          {t('auth.signup.legalNote')}
        </p>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted">
        {t('auth.signup.hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {t('auth.signup.signIn')}
        </Link>
      </p>
        </>
      )}
    </>
  )
}
