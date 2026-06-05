export type BrandPresetId =
  | 'orbit'
  | 'ocean'
  | 'forest'
  | 'grape'
  | 'slate'
  | 'rose'
  | 'custom'

export interface TenantBrandTheme {
  presetId: BrandPresetId
  accent: string
  accentSoft?: string
}

export const BRAND_PRESETS: Record<
  Exclude<BrandPresetId, 'custom'>,
  { accent: string; accentSoft: string }
> = {
  orbit: { accent: '#d65a31', accentSoft: 'rgb(214 90 49 / 0.12)' },
  ocean: { accent: '#0ea5e9', accentSoft: 'rgb(14 165 233 / 0.12)' },
  forest: { accent: '#059669', accentSoft: 'rgb(5 150 105 / 0.12)' },
  grape: { accent: '#7c3aed', accentSoft: 'rgb(124 58 237 / 0.12)' },
  slate: { accent: '#475569', accentSoft: 'rgb(71 85 105 / 0.12)' },
  rose: { accent: '#e11d48', accentSoft: 'rgb(225 29 72 / 0.12)' },
}

export function themeFromPreset(presetId: BrandPresetId, customAccent?: string): TenantBrandTheme {
  if (presetId === 'custom' && customAccent) {
    const accent = normalizeHex(customAccent)
    return {
      presetId: 'custom',
      accent,
      accentSoft: hexToSoft(accent),
    }
  }
  const preset = BRAND_PRESETS[presetId === 'custom' ? 'orbit' : presetId]
  return { presetId: presetId === 'custom' ? 'orbit' : presetId, ...preset }
}

export function parseBrandTheme(raw: unknown): TenantBrandTheme {
  if (!raw || typeof raw !== 'object') return themeFromPreset('orbit')
  const o = raw as Record<string, unknown>
  const presetId = typeof o.presetId === 'string' ? (o.presetId as BrandPresetId) : 'orbit'
  if (presetId === 'custom' && typeof o.accent === 'string') {
    return themeFromPreset('custom', o.accent)
  }
  if (presetId in BRAND_PRESETS) return themeFromPreset(presetId as Exclude<BrandPresetId, 'custom'>)
  return themeFromPreset('orbit')
}

export function applyBrandThemeToDocument(theme: TenantBrandTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-soft', theme.accentSoft ?? hexToSoft(theme.accent))
  root.style.setProperty('--selection', hexToSoft(theme.accent, 0.2))
  root.dataset.tenantAccent = theme.presetId
}

function normalizeHex(value: string): string {
  const v = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const r = v[1]
    const g = v[2]
    const b = v[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#d65a31'
}

function hexToSoft(hex: string, alpha = 0.12): string {
  const h = normalizeHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${r} ${g} ${b} / ${alpha})`
}
