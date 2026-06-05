import { cn } from '@/lib/utils'

/** Ancho y padding compartidos en toda la landing (misma línea vertical). */
export const landingContainerClass = 'mx-auto w-full max-w-[1120px] px-6 sm:px-8'

export function LandingContainer({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'header' | 'footer'
}) {
  return <Tag className={cn(landingContainerClass, className)}>{children}</Tag>
}

export function LandingSection({
  id,
  children,
  className,
  variant = 'default',
}: {
  id?: string
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'raised'
}) {
  return (
    <section
      id={id}
      className={cn(
        'border-t border-border-subtle py-20 sm:py-24',
        variant === 'raised'
          ? 'bg-white/60 backdrop-blur-md dark:bg-surface-raised/40 dark:backdrop-blur-sm'
          : 'bg-transparent',
        className
      )}
    >
      <div className={landingContainerClass}>{children}</div>
    </section>
  )
}

export function LandingSectionHeader({
  label,
  title,
  intro,
  className,
}: {
  label: string
  title: string
  intro?: string
  className?: string
}) {
  return (
    <header className={cn('max-w-2xl', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-[2rem]">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">{intro}</p>
      )}
    </header>
  )
}
