export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_STORAGE_KEY = 'orbit-locale'
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'es' || value === 'en'
}
