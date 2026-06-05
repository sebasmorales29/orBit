'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CalendarRange } from 'lucide-react'
import {
  DATE_PRESET_IDS,
  buildRangeFromInputs,
  dateRangeToSearchParams,
  formatDateRangeLabel,
  parseDateRangeFromSearchParams,
  presetToRange,
  toDateInputValue,
  type DatePresetId,
  type DateRangeMode,
  type DateRangeValue,
} from '@/lib/dates/range'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  className?: string
}

export function DateRangeFilter({ className }: DateRangeFilterProps) {
  const { t, locale } = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = useMemo(() => {
    const record: Record<string, string> = {}
    searchParams.forEach((v, k) => {
      record[k] = v
    })
    return parseDateRangeFromSearchParams(record)
  }, [searchParams])

  const [mode, setMode] = useState<DateRangeMode>(current.mode)
  const [fromStr, setFromStr] = useState(toDateInputValue(current.from))
  const [toStr, setToStr] = useState(toDateInputValue(current.to))

  const applyRange = useCallback(
    (range: DateRangeValue) => {
      const params = dateRangeToSearchParams(range)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
      router.refresh()
    },
    [pathname, router]
  )

  function applyPreset(preset: DatePresetId) {
    const range = presetToRange(preset)
    setMode(range.mode)
    setFromStr(toDateInputValue(range.from))
    setToStr(toDateInputValue(range.to))
    applyRange(range)
  }

  function applyCustom() {
    const built = buildRangeFromInputs({
      mode,
      fromStr,
      toStr: mode === 'range' ? toStr : fromStr,
      preset: 'custom',
    })
    if (!built) return
    applyRange(built)
  }

  const activePreset = current.preset

  return (
    <section
      className={cn(
        'rounded-2xl border border-border-subtle bg-surface px-4 py-3 shadow-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <CalendarRange className="h-4 w-4 text-accent" strokeWidth={1.8} />
          {t('dateFilter.title')}
        </div>
        <p className="text-[12px] text-muted">
          {formatDateRangeLabel(current, t, locale === 'en' ? 'en-US' : 'es-CR')}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {DATE_PRESET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
              activePreset === id
                ? 'bg-foreground text-surface'
                : 'bg-surface-raised text-muted hover:text-foreground'
            )}
          >
            {t(`dateFilter.presets.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4">
        <div className="flex rounded-full border border-border bg-surface-raised p-0.5 text-[12px]">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={cn(
              'rounded-full px-3 py-1 font-medium transition-colors',
              mode === 'single' ? 'bg-foreground text-surface' : 'text-muted'
            )}
          >
            {t('dateFilter.modeSingle')}
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={cn(
              'rounded-full px-3 py-1 font-medium transition-colors',
              mode === 'range' ? 'bg-foreground text-surface' : 'text-muted'
            )}
          >
            {t('dateFilter.modeRange')}
          </button>
        </div>

        <label className="flex flex-col gap-1 text-[11px] text-muted">
          {mode === 'single' ? t('dateFilter.day') : t('dateFilter.from')}
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-accent/50"
          />
        </label>

        {mode === 'range' && (
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            {t('dateFilter.to')}
            <input
              type="date"
              value={toStr}
              onChange={(e) => setToStr(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-accent/50"
            />
          </label>
        )}

        <button
          type="button"
          onClick={applyCustom}
          className="mt-auto rounded-full bg-accent px-4 py-2 text-[12px] font-medium text-on-accent hover:opacity-95"
        >
          {t('dateFilter.apply')}
        </button>
      </div>
    </section>
  )
}
