import { cn } from '@/lib/utils'
import { appMainClass } from '@/components/layout/app-layout'

interface AppMainProps {
  children: React.ReactNode
  className?: string
}

export function AppMain({ children, className }: AppMainProps) {
  return <main className={cn(appMainClass, className)}>{children}</main>
}
