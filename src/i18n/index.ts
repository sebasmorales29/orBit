import type { Locale } from './locale'
import en from './messages/en'
import es from './messages/es'
import type { Messages } from './translate'

const catalogs: Record<Locale, Messages> = { es, en }

export function getMessages(locale: Locale): Messages {
  return catalogs[locale]
}

export {
  type Locale,
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALE_STORAGE_KEY_LEGACY,
  isLocale,
} from './locale'
export type { Messages } from './translate'
export { translate } from './translate'
