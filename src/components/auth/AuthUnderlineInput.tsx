'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface AuthUnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  authField: 'email' | 'password'
  onFieldFocus?: () => void
  onFieldBlur?: () => void
  onPasswordVisibleChange?: (visible: boolean) => void
}

export function AuthUnderlineInput({
  label,
  authField,
  onFieldFocus,
  onFieldBlur,
  onPasswordVisibleChange,
  className,
  id,
  type,
  ...props
}: AuthUnderlineInputProps) {
  const inputId = id ?? authField
  const { t } = useTranslations()
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  function togglePasswordVisibility() {
    const next = !showPassword
    setShowPassword(next)
    onPasswordVisibleChange?.(next)
  }

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          data-auth-field={authField}
          type={isPassword && showPassword ? 'text' : type}
          onFocus={() => onFieldFocus?.()}
          onBlur={() => onFieldBlur?.()}
          className={cn(
            'w-full border-0 border-b border-border bg-transparent py-2.5 pr-10 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-foreground"
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
    </div>
  )
}
