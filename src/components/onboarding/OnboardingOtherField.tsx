'use client'

import { Input } from '@/components/ui/Input'

interface OnboardingOtherFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function OnboardingOtherField({
  label,
  placeholder,
  value,
  onChange,
}: OnboardingOtherFieldProps) {
  return (
    <div>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  )
}
