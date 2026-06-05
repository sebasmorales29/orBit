import { getMessages } from '@/i18n'
import type { Locale } from '@/i18n'

export function periodLabelForLocale(locale: Locale, key: string): string {
  const messages = getMessages(locale) as { dateFilter?: { presets?: Record<string, string> } }
  const presets = messages.dateFilter?.presets
  if (presets && key.startsWith('dateFilter.presets.')) {
    const id = key.replace('dateFilter.presets.', '')
    if (presets[id]) return presets[id]
  }
  return key
}
