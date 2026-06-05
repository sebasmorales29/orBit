'use client'

import { createContext, useContext } from 'react'
import type { Organization } from '@/types/database'

const OrgContext = createContext<Organization | null>(null)

export function AppOrgProvider({
  org,
  children,
}: {
  org: Organization
  children: React.ReactNode
}) {
  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>
}

export function useAppOrg(): Organization | null {
  return useContext(OrgContext)
}
