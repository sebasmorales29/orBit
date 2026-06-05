import type { BusinessVertical } from '@/lib/business-context/types'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function adaptLabel(
  scope: BusinessVertical,
  key: string,
  t: TranslateFn
): string {
  const scoped = `app.adapt.labels.${scope}.${key}`
  const translated = t(scoped)
  if (translated !== scoped) return translated
  return t(`app.adapt.labels.default.${key}`)
}

/** Añade el período activo; quita sufijo fijo «(mes)» si venía de plantillas antiguas. */
export function adaptLabelWithPeriod(
  scope: BusinessVertical,
  key: string,
  t: TranslateFn,
  period: string
): string {
  const base = adaptLabel(scope, key, t)
  const stripped = base.replace(/\s*\(mes\)\s*$/i, '').replace(/\s*\(month\)\s*$/i, '').trim()
  return `${stripped} (${period})`
}

export function adaptQuickLabel(
  scope: BusinessVertical,
  action: string,
  t: TranslateFn
): string {
  const scoped = `app.adapt.quick.${scope}.${action}`
  const translated = t(scoped)
  if (translated !== scoped) return translated
  return t(`app.dashboard.quick.${action}`)
}
