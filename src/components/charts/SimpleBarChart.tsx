'use client'

import { transitionHeight } from '@/lib/motion'
import { cn } from '@/lib/utils'

export type BarSeries = {
  key: string
  label: string
  colorClass: string
}

type Props = {
  points: Array<{ label: string; values: Record<string, number> }>
  series: BarSeries[]
  formatValue?: (n: number) => string
}

export function SimpleBarChart({ points, series, formatValue }: Props) {
  const fmt = formatValue ?? ((n: number) => String(Math.round(n)))
  const max = Math.max(
    1,
    ...points.flatMap((p) => series.map((s) => p.values[s.key] ?? 0))
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-[11px] text-muted">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-sm', s.colorClass)} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end justify-between gap-2 border-b border-border pb-1 pt-2">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full max-w-[48px] items-end justify-center gap-0.5">
              {series.map((s) => {
                const v = point.values[s.key] ?? 0
                const h = Math.max(4, Math.round((v / max) * 100))
                return (
                  <div
                    key={s.key}
                    className={cn('w-2.5 rounded-t-sm sm:w-3', transitionHeight, s.colorClass)}
                    style={{ height: `${h}%` }}
                    title={`${s.label}: ${fmt(v)}`}
                  />
                )
              })}
            </div>
            <span className="max-w-[52px] truncate text-center text-[9px] text-muted">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
