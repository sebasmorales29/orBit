import { getCountries, getCountryCallingCode } from 'libphonenumber-js/min'
import type { CountryCode } from 'libphonenumber-js'

export type { CountryCode }

/** Países más usados en la app (Costa Rica primero). */
export const PHONE_COUNTRY_PRIORITY: CountryCode[] = [
  'CR',
  'US',
  'MX',
  'PA',
  'NI',
  'GT',
  'HN',
  'SV',
  'CO',
  'ES',
  'AR',
  'CL',
  'PE',
  'BR',
  'CA',
  'GB',
]

export function countryFlag(iso: CountryCode): string {
  const code = iso.toUpperCase()
  if (code.length !== 2) return '🌐'
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

export function countryLabel(iso: CountryCode, locale = 'es'): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    return names.of(iso) ?? iso
  } catch {
    return iso
  }
}

export function dialCode(iso: CountryCode): string {
  return `+${getCountryCallingCode(iso)}`
}

export interface PhoneCountryOption {
  iso: CountryCode
  flag: string
  name: string
  dial: string
}

const cachedByLocale = new Map<string, PhoneCountryOption[]>()

export function listPhoneCountries(locale = 'es'): PhoneCountryOption[] {
  const hit = cachedByLocale.get(locale)
  if (hit) return hit

  const all = getCountries() as CountryCode[]
  const prioritySet = new Set(PHONE_COUNTRY_PRIORITY)
  const ordered = [
    ...PHONE_COUNTRY_PRIORITY,
    ...all.filter((c) => !prioritySet.has(c)).sort((a, b) =>
      countryLabel(a, locale).localeCompare(countryLabel(b, locale), locale)
    ),
  ]

  const options = ordered.map((iso) => ({
    iso,
    flag: countryFlag(iso),
    name: countryLabel(iso, locale),
    dial: dialCode(iso),
  }))

  cachedByLocale.set(locale, options)
  return options
}

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'CR'
