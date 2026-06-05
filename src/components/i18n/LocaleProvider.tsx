'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { BRAND_NAME } from '@/lib/brand'
import {
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
} from '@/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function persistLocale(locale: Locale) {
  document.documentElement.lang = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;sameSite=lax`
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  return <LocaleProviderInner>{children}</LocaleProviderInner>
}

export function LocaleProviderInner({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE)

  useEffect(() => {
    // Si el servidor ya nos dio un locale inicial, lo respetamos.
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    const fromStorage = isLocale(stored) ? stored : null
    const next = fromStorage ?? initialLocale ?? DEFAULT_LOCALE
    setLocaleState(next)
    persistLocale(next)
  }, [initialLocale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    persistLocale(next)
  }, [])

  const messages = useMemo(() => getMessages(locale), [locale])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const merged = { brand: BRAND_NAME, ...params }
      return translate(messages, key, merged)
    },
    [messages]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useTranslations() {
  const { t, locale, setLocale } = useLocale()
  return { t, locale, setLocale }
}
