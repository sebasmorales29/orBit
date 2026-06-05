'use client'

import { createContext, useContext, useMemo } from 'react'
import { resolveBusinessAdaptation } from '@/lib/business-context/resolve'
import type { BusinessAdaptation } from '@/lib/business-context/types'
import type { Organization } from '@/types/database'

const BusinessContext = createContext<BusinessAdaptation | null>(null)

export function BusinessContextProvider({
  org,
  children,
}: {
  org: Organization
  children: React.ReactNode
}) {
  const adaptation = useMemo(() => resolveBusinessAdaptation(org), [org])

  return (
    <BusinessContext.Provider value={adaptation}>{children}</BusinessContext.Provider>
  )
}

export function useBusinessAdaptation(): BusinessAdaptation {
  const ctx = useContext(BusinessContext)
  if (!ctx) {
    throw new Error('useBusinessAdaptation must be used within BusinessContextProvider')
  }
  return ctx
}
