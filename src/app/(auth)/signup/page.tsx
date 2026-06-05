'use client'

import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { SignupForm } from '@/components/auth/SignupForm'
import { useAuthFocus } from '@/components/auth/use-auth-focus'

export default function SignupPage() {
  const { focusField, passwordVisible, onFieldFocus, onFieldBlur, onPasswordVisibleChange } =
    useAuthFocus()

  return (
    <AuthSplitLayout focusField={focusField} passwordVisible={passwordVisible}>
      <SignupForm
        onFieldFocus={onFieldFocus}
        onFieldBlur={onFieldBlur}
        onPasswordVisibleChange={onPasswordVisibleChange}
      />
    </AuthSplitLayout>
  )
}
