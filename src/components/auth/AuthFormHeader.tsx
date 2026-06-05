import { cn } from '@/lib/utils'

interface AuthFormHeaderProps {
  title?: string
  subtitle?: string
}

export function AuthFormHeader({ title, subtitle }: AuthFormHeaderProps) {
  if (!title && !subtitle) return null

  return (
    <div>
      {title && (
        <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
      )}
      {subtitle && (
        <p
          className={cn(
            'text-[14px] leading-relaxed text-muted',
            title ? 'mt-2' : 'text-[15px] text-muted'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
