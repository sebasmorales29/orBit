export type DatePresetId = '48h' | '1d' | '7d' | '30d' | 'mtd' | 'custom'

export type DateRangeMode = 'single' | 'range'

export interface DateRangeValue {
  mode: DateRangeMode
  preset: DatePresetId
  from: Date
  to: Date
}

export const DATE_PRESET_IDS: DatePresetId[] = ['48h', '1d', '7d', '30d', 'mtd']

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function presetToRange(preset: DatePresetId, now = new Date()): DateRangeValue {
  const end = endOfDay(now)

  switch (preset) {
    case '48h': {
      const from = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      return { mode: 'range', preset, from, to: now }
    }
    case '1d':
      return { mode: 'single', preset, from: startOfDay(now), to: end }
    case '7d': {
      const from = startOfDay(now)
      from.setDate(from.getDate() - 6)
      return { mode: 'range', preset, from, to: end }
    }
    case '30d': {
      const from = startOfDay(now)
      from.setDate(from.getDate() - 29)
      return { mode: 'range', preset, from, to: end }
    }
    case 'mtd': {
      const from = startOfDay(now)
      from.setDate(1)
      return { mode: 'range', preset, from, to: end }
    }
    default:
      return presetToRange('mtd', now)
  }
}

export function defaultDateRange(): DateRangeValue {
  return presetToRange('mtd')
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildRangeFromInputs(input: {
  mode: DateRangeMode
  fromStr: string
  toStr?: string
  preset?: DatePresetId
}): DateRangeValue | null {
  const fromDate = parseDateInput(input.fromStr)
  if (!fromDate) return null

  if (input.mode === 'single') {
    return {
      mode: 'single',
      preset: input.preset ?? 'custom',
      from: startOfDay(fromDate),
      to: endOfDay(fromDate),
    }
  }

  const toDate = parseDateInput(input.toStr ?? input.fromStr)
  if (!toDate) return null

  const from = startOfDay(fromDate)
  const to = endOfDay(toDate)
  if (from.getTime() > to.getTime()) return null

  return {
    mode: 'range',
    preset: input.preset ?? 'custom',
    from,
    to,
  }
}

export function parseDateRangeFromSearchParams(
  params: Record<string, string | string[] | undefined>
): DateRangeValue {
  const period = typeof params.period === 'string' ? params.period : undefined
  if (period && DATE_PRESET_IDS.includes(period as DatePresetId)) {
    return presetToRange(period as DatePresetId)
  }

  const mode = params.mode === 'single' ? 'single' : 'range'
  const fromStr = typeof params.from === 'string' ? params.from : undefined
  const toStr = typeof params.to === 'string' ? params.to : undefined

  if (fromStr) {
    const built = buildRangeFromInputs({
      mode,
      fromStr,
      toStr,
      preset: 'custom',
    })
    if (built) return built
  }

  return defaultDateRange()
}

export function dateRangeToSearchParams(range: DateRangeValue): URLSearchParams {
  const p = new URLSearchParams()
  if (range.preset !== 'custom') {
    p.set('period', range.preset)
    return p
  }
  p.set('mode', range.mode)
  p.set('from', toDateInputValue(range.from))
  p.set('to', toDateInputValue(range.to))
  return p
}

export function isWithinRange(iso: string, range: DateRangeValue): boolean {
  const t = new Date(iso).getTime()
  return t >= range.from.getTime() && t <= range.to.getTime()
}

export function formatDateRangeLabel(
  range: DateRangeValue,
  t: (key: string) => string,
  locale = 'es-CR'
): string {
  if (range.preset !== 'custom') {
    return t(`dateFilter.presets.${range.preset}`)
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  if (range.mode === 'single') return fmt(range.from)
  return `${fmt(range.from)} – ${fmt(range.to)}`
}
