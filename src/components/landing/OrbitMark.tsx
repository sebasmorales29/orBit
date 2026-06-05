import { cn } from '@/lib/utils'

interface OrbitMarkProps {
  className?: string
  size?: 'sm' | 'md'
}

export function OrbitMark({ className, size = 'md' }: OrbitMarkProps) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-accent',
        box,
        className
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={cn(icon, 'text-on-accent')}
        aria-hidden
      >
        <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2" />
        <ellipse
          cx="8"
          cy="8"
          rx="5"
          ry="2"
          stroke="currentColor"
          strokeWidth="0.9"
          transform="rotate(-20 8 8)"
        />
        <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      </svg>
    </div>
  )
}
