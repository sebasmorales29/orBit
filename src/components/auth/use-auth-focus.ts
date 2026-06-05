'use client'

import { useCallback, useRef, useState } from 'react'
import type { AuthFocusField } from '@/components/auth/auth-scene'

export function useAuthFocus() {
  const [focusField, setFocusField] = useState<AuthFocusField>('none')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onFieldFocus = useCallback((field: AuthFocusField) => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setFocusField(field)
    if (field !== 'password') {
      setPasswordVisible(false)
    }
  }, [])

  const onFieldBlur = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    blurTimer.current = setTimeout(() => {
      const active = document.activeElement
      const field = active?.getAttribute('data-auth-field')
      if (field === 'email' || field === 'password' || field === 'confirm-password') return
      setFocusField('none')
      setPasswordVisible(false)
    }, 80)
  }, [])

  const onPasswordVisibleChange = useCallback((visible: boolean) => {
    setPasswordVisible(visible)
  }, [])

  return {
    focusField,
    passwordVisible,
    onFieldFocus,
    onFieldBlur,
    onPasswordVisibleChange,
  }
}
