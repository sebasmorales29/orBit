import { cn } from '@/lib/utils'

/** Desaceleración suave, sin overshoot (estilo iOS / Material emphasized) */
export const EASE_SMOOTH = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Transiciones estándar UI */
export const EASE_STANDARD = 'cubic-bezier(0.4, 0, 0.2, 1)'

const easeSmooth = `ease-[${EASE_SMOOTH}]`
const easeStandard = `ease-[${EASE_STANDARD}]`

export const motionReduce =
  'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:active:scale-100'

/** Solo propiedades que el compositor anima bien */
const interactiveTransition = cn(
  'transition-[transform,opacity,box-shadow,background-color,border-color,color,filter]',
  'duration-200',
  easeSmooth,
  motionReduce
)

/** Press sutil — sin “salto” vertical que se siente pegajoso */
export const interactivePressClass = cn(
  interactiveTransition,
  'active:scale-[0.98]'
)

export const interactivePressPrimaryClass = cn(
  interactivePressClass,
  'hover:shadow-[0_4px_16px_rgb(214_90_49/0.28)] active:shadow-[0_2px_8px_rgb(214_90_49/0.2)]'
)

export const interactivePressSolidClass = cn(
  interactivePressClass,
  'hover:shadow-[0_4px_14px_rgb(22_24_28/0.08)] dark:hover:shadow-[0_4px_14px_rgb(0_0_0/0.28)]'
)

/** Thumb / sliders — solo transform */
export const transitionThumb = cn(
  'transition-transform duration-[280ms]',
  easeSmooth,
  'will-change-transform',
  motionReduce
)

/** Texto, bordes, fondos */
export const transitionColors = cn(
  'transition-colors duration-200',
  easeStandard,
  motionReduce
)

/** Fade / overlays */
export const transitionFade = cn(
  'transition-opacity duration-[250ms]',
  easeSmooth,
  motionReduce
)

/** Iconos (tema, etc.) */
export const transitionIcon = cn(
  'transition-[opacity,transform] duration-[260ms]',
  easeSmooth,
  motionReduce
)

/** Entrada suave (menús, sheets) */
export const transitionReveal = cn(
  'transition-[transform,opacity] duration-[320ms]',
  easeSmooth,
  motionReduce
)

/** Gráficos y barras */
export const transitionHeight = cn(
  'transition-[height] duration-500',
  easeSmooth,
  motionReduce
)
