'use client'

import { Check } from 'lucide-react'
import type { PasswordChecks } from '@/lib/auth-validation'
import { cn } from '@/lib/utils'

interface PasswordRulesProps {
  checks: PasswordChecks
  t: (key: string) => string
}

export function PasswordRules({ checks, t }: PasswordRulesProps) {
  const rules = [
    { ok: checks.minLength, label: t('auth.signup.ruleLength') },
    { ok: checks.hasUpper, label: t('auth.signup.ruleUpper') },
    { ok: checks.hasLower, label: t('auth.signup.ruleLower') },
    { ok: checks.hasNumber, label: t('auth.signup.ruleNumber') },
    { ok: checks.hasSymbol, label: t('auth.signup.ruleSymbol') },
  ]

  return (
    <ul className="mt-2 space-y-1.5 rounded-xl border border-border bg-surface-card/50 px-3 py-2.5">
      {rules.map((rule) => (
        <li key={rule.label} className="flex items-center gap-2 text-[12px]">
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              rule.ok
                ? 'border-foreground bg-foreground text-surface'
                : 'border-border bg-transparent text-transparent'
            )}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          <span className={rule.ok ? 'text-foreground' : 'text-muted'}>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}
