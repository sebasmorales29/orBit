import { cn } from '@/lib/utils'

/** Ancho máximo alineado con la landing; padding responsive en los bordes. */
export const appShellClass =
  'mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10 xl:px-12'

export const appMainClass = cn(appShellClass, 'py-5 sm:py-6 lg:py-8')
