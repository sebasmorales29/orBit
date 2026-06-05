'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { AuthFocusField } from '@/components/auth/auth-scene'

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  fieldError?: string
  authField?: AuthFocusField
  onFieldFocus?: () => void
  onFieldBlur?: () => void
  onPasswordVisibleChange?: (visible: boolean) => void
}

export function AuthField({
  label,
  hint,
  fieldError,
  authField = 'none',
  onFieldFocus,
  onFieldBlur,
  onPasswordVisibleChange,
  className,
  id,
  type,
  ...props
}: AuthFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const { t } = useTranslations()
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  function togglePasswordVisibility() {
    const next = !showPassword
    setShowPassword(next)
    onPasswordVisibleChange?.(next)
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          data-auth-field={authField === 'none' ? undefined : authField}
          type={isPassword && showPassword ? 'text' : type}
          onFocus={() => onFieldFocus?.()}
          onBlur={() => onFieldBlur?.()}
          className={cn(
            'w-full rounded-xl border bg-surface-raised px-4 py-3 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
            fieldError ? 'border-red-400/70' : 'border-border',
            isPassword && 'pr-11',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-foreground"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>
      {fieldError ? (
        <p className="text-[12px] text-red-500" role="alert">
          {fieldError}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
