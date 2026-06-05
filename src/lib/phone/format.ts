import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { DEFAULT_PHONE_COUNTRY } from '@/lib/phone/countries'

export function formatNationalNumber(digits: string, country: CountryCode): string {
  const raw = digits.replace(/\D/g, '')
  if (!raw) return ''
  return new AsYouType(country).input(raw)
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

  const digits = digitsFromFormatted(trimmed)
  return {
    country: defaultCountry,
    nationalDigits: digits,
    display: formatNationalNumber(digits, defaultCountry),
  }
}
