'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthFormHeader } from '@/components/auth/AuthFormHeader'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { PasswordRules } from '@/components/auth/PasswordRules'
import { checkPassword, isPasswordStrong } from '@/lib/auth-validation'
import { AuthField } from '@/components/auth/AuthField'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'
import { useAuthFocus } from '@/components/auth/use-auth-focus'
import { useTranslations } from '@/components/i18n/LocaleProvider'

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordInner />
    </Suspense>
  )
}

function ChangePasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()
  const { t } = useTranslations()
  const { focusField, passwordVisible, onFieldFocus, onFieldBlur, onPasswordVisibleChange } =
    useAuthFocus()

  const next = params.get('next') ?? '/hoy'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordChecks = useMemo(() => checkPassword(password), [password])
  const passwordOk = isPasswordStrong(passwordChecks)

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

    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })

    setLoading(false)

    if (authError) {
      toast.error(authError.message)
      return
    }

    toast.success('Contraseña actualizada')
    router.push(next)
    router.refresh()
  }

  return (
    <AuthSplitLayout focusField={focusField} passwordVisible={passwordVisible}>
      <AuthFormHeader
        title="Cambiar contraseña"
        subtitle="Por seguridad, necesitás establecer una contraseña propia antes de continuar."
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <AuthField
            label="Nueva contraseña"
            authField="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFieldFocus={() => onFieldFocus('password')}
            onFieldBlur={onFieldBlur}
            onPasswordVisibleChange={onPasswordVisibleChange}
            required
            autoComplete="new-password"
          />
          <PasswordRules checks={passwordChecks} t={t} />
        </div>

        <AuthField
          label="Confirmar contraseña"
          authField="password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFieldFocus={() => onFieldFocus('password')}
          onFieldBlur={onFieldBlur}
          onPasswordVisibleChange={onPasswordVisibleChange}
          required
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full py-3" loading={loading}>
          Guardar y continuar
        </Button>
      </form>
    </AuthSplitLayout>
  )
}

