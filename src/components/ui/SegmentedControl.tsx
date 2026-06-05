'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motionReduce, transitionThumb } from '@/lib/motion'
import { cn } from '@/lib/utils'

export type SegmentThumbVariant = 'accent' | 'foreground' | 'soft'

export type SegmentedControlOption<T extends string> = {
  id: T
  label: React.ReactNode
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedControlOption<T>[]
  thumbVariant?: SegmentThumbVariant
  shape?: 'pill' | 'rounded'
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
  ariaLabel?: string
}

const thumbStyles: Record<SegmentThumbVariant, string> = {
  accent: 'bg-accent shadow-[0_2px_10px_rgb(214_90_49/0.28)]',
  foreground:
    'bg-foreground shadow-[0_2px_10px_rgb(22_24_28/0.12)] dark:shadow-[0_2px_10px_rgb(0_0_0/0.35)]',
  soft: 'border border-accent/40 bg-accent-soft shadow-sm',
}

const activeText: Record<SegmentThumbVariant, string> = {
  accent: 'text-on-accent',
  foreground: 'text-surface',
  soft: 'text-accent',
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  thumbVariant = 'accent',
  shape = 'pill',
  size = 'md',
  fullWidth,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ width: 0, left: 0 })

  const measureThumb = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const active = track.querySelector<HTMLElement>(`[data-segment-id="${value}"]`)
    if (!active) return
    setThumb({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value])

  useLayoutEffect(() => {
    measureThumb()
  }, [measureThumb, options])

  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measureThumb)
    ro.observe(track)
    window.addEventListener('resize', measureThumb)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measureThumb)
    }
  }, [measureThumb])

  const rounded = shape === 'pill' ? 'rounded-full' : 'rounded-xl'
  const pad = size === 'sm' ? 'p-0.5' : 'p-1'
  const btnPad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-5 py-2.5 text-[13px]'

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex items-center gap-0.5 border border-border-subtle bg-white/90 dark:border-border dark:bg-surface-raised/90',
        rounded,
        pad,
        fullWidth && 'flex w-full',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0.5 bottom-0.5 left-0',
          transitionThumb,
          rounded,
          thumbStyles[thumbVariant]
        )}
        style={{
          width: thumb.width,
          transform: `translateX(${thumb.left}px)`,
          opacity: thumb.width > 0 ? 1 : 0,
        }}
      />

      {options.map((opt) => {
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            data-segment-id={opt.id}
            aria-selected={selected}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative z-10 font-semibold tracking-wide',
              'transition-[color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'active:scale-[0.99]',
              motionReduce,
              rounded,
              btnPad,
              fullWidth && 'flex-1',
              selected
                ? cn(activeText[thumbVariant], 'font-semibold')
                : 'font-medium text-muted hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
