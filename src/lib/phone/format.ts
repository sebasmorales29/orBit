import {
  AsYouType,
  formatIncompletePhoneNumber,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { DEFAULT_PHONE_COUNTRY } from '@/lib/phone/countries'

/** Quita el código de país si el usuario lo escribe en el campo nacional. */
export function stripLeadingDialCode(digits: string, country: CountryCode): string {
  let raw = digits.replace(/\D/g, '')
  if (!raw) return ''

  const dial = getCountryCallingCode(country)

  if (raw.startsWith('00')) {
    raw = raw.slice(2)
  }

  if (raw.startsWith(dial)) {
    return raw.slice(dial.length)
  }

  // Ej. escribe "5", "50", "506" mientras intenta repetir +506 en el input
  if (dial.startsWith(raw)) {
    return ''
  }

  return raw
}

export function formatNationalNumber(digits: string, country: CountryCode): string {
  const raw = stripLeadingDialCode(digits.replace(/\D/g, ''), country)
  if (!raw) return ''
  return formatIncompletePhoneNumber(raw, country)
}

export function digitsFromFormatted(value: string): string {
  return value.replace(/\D/g, '')
}

export function toE164(country: CountryCode, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, '')
  if (!digits) return ''

  const parsed = parsePhoneNumberFromString(digits, country)
  if (parsed?.isValid()) return parsed.format('E.164')

  const typed = new AsYouType(country)
  typed.input(digits)
  const number = typed.getNumber()
  if (number) return number.format('E.164')

  return `+${digits}`
}

export function splitPhoneValue(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): { country: CountryCode; nationalDigits: string; display: string } {
  const trimmed = value.trim()
  if (!trimmed) {
    return { country: defaultCountry, nationalDigits: '', display: '' }
  }

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)
  if (parsed) {
    const country = (parsed.country ?? defaultCountry) as CountryCode
    const nationalDigits = parsed.nationalNumber.toString()
    return {
      country,
      nationalDigits,
      display: formatNationalNumber(nationalDigits, country),
    }
  }

  const digits = stripLeadingDialCode(digitsFromFormatted(trimmed), defaultCountry)
  return {
    country: defaultCountry,
    nationalDigits: digits,
    display: formatNationalNumber(digits, defaultCountry),
  }
}
