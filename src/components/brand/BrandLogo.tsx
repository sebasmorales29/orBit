import Image from 'next/image'
import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'
import { cn } from '@/lib/utils'

const LOGO_SRC = '/brand/logo-icon-light.png'
/** Proporción del PNG (256×170) — mismo tamaño visual en claro y oscuro */
const LOGO_RATIO = 256 / 170

type BrandLogoProps = {
  href?: string
  /** Altura visible del logo en px */
  size?: number
  /** Altura en viewport md+ (opcional) */
  sizeMd?: number
  className?: string
  priority?: boolean
  onClick?: () => void
}

export function BrandLogo({
  href = '/',
  size = 36,
  sizeMd,
  className,
  priority,
  onClick,
}: BrandLogoProps) {
  const height = sizeMd ?? size
  const width = Math.round(height * LOGO_RATIO)

  const image = (
    <Image
      src={LOGO_SRC}
      alt=""
      width={width}
      height={height}
      priority={priority}
      aria-hidden
      className={cn(
        'object-contain',
        'h-[var(--logo-h)] w-auto',
        sizeMd != null && 'md:h-[var(--logo-h-md)]',
        className
      )}
      style={
        {
          '--logo-h': `${size}px`,
          ...(sizeMd != null ? { '--logo-h-md': `${sizeMd}px` } : {}),
        } as React.CSSProperties
      }
    />
  )

  const wrapClass = 'inline-flex shrink-0 items-center justify-center'

  if (href) {
    return (
      <Link href={href} className={wrapClass} onClick={onClick} aria-label={BRAND_NAME}>
        {image}
      </Link>
    )
  }

  return <span className={wrapClass}>{image}</span>
}
