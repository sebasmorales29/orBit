import { cn } from '@/lib/utils'

interface VelumMarkProps {
  className?: string
  size?: 'sm' | 'md'
}

/** Isotipo Velum — capas finas que ordenan. */
export function VelumMark({ className, size = 'md' }: VelumMarkProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-accent',
        box,
        className
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={cn(icon, 'text-on-accent')}
        aria-hidden
      >
        <path
          d="M3 14c3-4 11-4 14 0"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M4 10.5c2.5-2.5 9.5-2.5 12 0"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M5.5 7c2-1.8 7-1.8 9 0"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}
