'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DEFAULT_PHONE_COUNTRY,
  listPhoneCountries,
  type CountryCode,
} from '@/lib/phone/countries'
import {
  digitsFromFormatted,
  formatNationalNumber,
  splitPhoneValue,
  toE164,
} from '@/lib/phone/format'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  defaultCountry?: CountryCode
  error?: string
  required?: boolean
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

export function PhoneInput({
  label,
  value,
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  error,
  required,
  placeholder,
  id: idProp,
  className,
  disabled,
}: PhoneInputProps) {
  const { locale } = useTranslations()
  const autoId = useId()
  const inputId = idProp ?? autoId
  const listId = `${inputId}-countries`

  const countries = useMemo(
    () => listPhoneCountries(locale === 'en' ? 'en' : 'es'),
    [locale]
  )

  const [country, setCountry] = useState<CountryCode>(defaultCountry)
  const [display, setDisplay] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const split = splitPhoneValue(value, defaultCountry)
    setCountry(split.country)
    setDisplay(split.display)
  }, [value, defaultCountry])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selected = countries.find((c) => c.iso === country) ?? countries[0]
  const dialDigits = selected.dial.replace(/\D/g, '')

  function emit(countryCode: CountryCode, nationalDigits: string) {
    onChange(nationalDigits ? toE164(countryCode, nationalDigits) : '')
  }

  function handleCountryPick(iso: CountryCode) {
    setCountry(iso)
    setPickerOpen(false)
    const digits = digitsFromFormatted(display)
    setDisplay(formatNationalNumber(digits, iso))
    emit(iso, digits)
  }

  function handleInputChange(raw: string) {
    let digits = digitsFromFormatted(raw)

    // Si el usuario pega/escribe el prefijo del país (ej. 5068888...), lo removemos
    // para que el input siempre sea solo número nacional. El código vive en el dropdown.
    if (dialDigits) {
      if (digits === dialDigits) {
        digits = ''
      } else if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
        digits = digits.slice(dialDigits.length)
      }
    }

    const formatted = formatNationalNumber(digits, country)
    setDisplay(formatted)
    emit(country, digits)
  }

  return (
    <div className={cn('space-y-1.5', className)} ref={rootRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex overflow-hidden rounded-xl border border-border bg-surface-raised transition-colors focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15',
          error && 'border-red-300',
          disabled && 'opacity-60'
        )}
      >
        <div className="relative shrink-0 border-r border-border">
          <button
            type="button"
            disabled={disabled}
            aria-expanded={pickerOpen}
            aria-controls={listId}
            onClick={() => setPickerOpen((o) => !o)}
            className="flex h-full min-h-[42px] items-center gap-1.5 px-2.5 text-[13px] text-foreground hover:bg-surface-hover sm:px-3"
          >
            <span className="text-base leading-none" aria-hidden>
              {selected.flag}
            </span>
            <span className="font-medium tabular-nums">{selected.dial}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
          </button>
          {pickerOpen && (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 top-full z-50 mt-1 max-h-56 w-[min(100vw-2rem,280px)] overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
            >
              {countries.map((c) => (
                <li key={c.iso} role="option" aria-selected={c.iso === country}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface-hover',
                      c.iso === country && 'bg-surface-hover'
                    )}
                    onClick={() => handleCountryPick(c.iso)}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={display}
          onChange={(e) => handleInputChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  )
}
