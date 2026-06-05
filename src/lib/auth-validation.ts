const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordChecks {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  }
}

export function isPasswordStrong(checks: PasswordChecks): boolean {
  return (
    checks.minLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSymbol
  )
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export function mapSignupAuthError(
  message: string,
  t: (key: string) => string,
  status?: number
): string {
  const lower = message.toLowerCase()
  if (
    status === 429 ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('only request this after')
  ) {
    return t('auth.signup.errorRateLimit')
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return t('auth.signup.errorEmailTaken')
  }
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('strength'))) {
    return t('auth.signup.errorPasswordRules')
  }
  if (lower.includes('valid email')) {
    return t('auth.signup.errorInvalidEmail')
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('your-project') ||
    lower.includes('anon key')
  ) {
    return t('auth.signup.errorSupabaseConfig')
  }
  return t('auth.signup.errorGeneric')
}

export function mapLoginAuthError(message: string, t: (key: string) => string): string {
  const lower = message.toLowerCase()
  if (lower.includes('email not confirmed') || lower.includes('not verified')) {
    return t('auth.login.errorEmailNotConfirmed')
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return t('auth.login.error')
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network')
  ) {
    return t('auth.signup.errorSupabaseConfig')
  }
  return t('auth.login.error')
}
