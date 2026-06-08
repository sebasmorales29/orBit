'use client'

import {
  BRAND_PRESETS,
  themeFromPreset,
  type BrandPresetId,
} from '@/lib/onboarding/brand-theme'
import { OnboardingOption } from '@/components/onboarding/OnboardingOption'
import { useTranslations } from '@/components/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const PRESET_IDS = ['velum', 'ocean', 'forest', 'grape', 'slate', 'rose', 'custom'] as const
type PresetOption = (typeof PRESET_IDS)[number]

export function OnboardingBrandStep({
  presetId,
  customAccent,
  onPresetChange,
  onCustomAccentChange,
}: {
  presetId: BrandPresetId
  customAccent: string
  onPresetChange: (id: BrandPresetId) => void
  onCustomAccentChange: (hex: string) => void
}) {
  const { t } = useTranslations()
  const preview = themeFromPreset(presetId, customAccent)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] font-medium text-accent">{t('onboarding.step6Eyebrow')}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{t('onboarding.step6Title')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t('onboarding.step6Subtitle')}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESET_IDS.filter((id): id is Exclude<PresetOption, 'custom'> => id !== 'custom').map((id) => {
          const colors = BRAND_PRESETS[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPresetChange(id)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                presetId === id
                  ? 'border-accent ring-2 ring-accent/25'
                  : 'border-border hover:border-accent/40'
              )}
            >
              <span
                className="mb-2 block h-8 w-full rounded-lg"
                style={{ backgroundColor: colors.accent }}
                aria-hidden
              />
              <span className="text-[13px] font-medium text-foreground">
                {t(`onboarding.brandPresets.${id}`)}
              </span>
            </button>
          )
        })}
        <OnboardingOption
          selected={presetId === 'custom'}
          onClick={() => onPresetChange('custom')}
          title={t('onboarding.brandPresets.custom')}
          description={t('onboarding.brandPresets.customDesc')}
          className="col-span-2 py-3 sm:col-span-1"
        />
      </div>

      {presetId === 'custom' && (
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {t('onboarding.brandCustomLabel')}
          </span>
          <div className="flex gap-3">
            <input
              type="color"
              value={customAccent.startsWith('#') ? customAccent : '#d65a31'}
              onChange={(e) => onCustomAccentChange(e.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-surface-raised"
            />
            <input
              type="text"
              value={customAccent}
              onChange={(e) => onCustomAccentChange(e.target.value)}
              placeholder="#d65a31"
              className="flex-1 rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[14px] text-foreground outline-none focus:border-accent/50"
            />
          </div>
        </label>
      )}

      <div
        className="rounded-2xl border border-border-subtle p-4"
        style={{ borderColor: preview.accent }}
      >
        <p className="text-[12px] text-muted">{t('onboarding.brandPreview')}</p>
        <button
          type="button"
          className="mt-3 rounded-full px-4 py-2 text-[13px] font-medium text-on-accent"
          style={{ backgroundColor: preview.accent }}
        >
          {t('onboarding.brandPreviewButton')}
        </button>
      </div>
    </div>
  )
}
