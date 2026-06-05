'use client'

import { createContext, useContext } from 'react'
import type { TenantPickerOrg } from '@/components/app/TenantPickerModal'
import type { Organization } from '@/types/database'

interface AppOrgContextValue {
  org: Organization
  organizations: TenantPickerOrg[]
}

const OrgContext = createContext<AppOrgContextValue | null>(null)

export function AppOrgProvider({
  org,
  organizations,
  children,
}: {
  org: Organization
  organizations: TenantPickerOrg[]
  children: React.ReactNode
}) {
  return (
    <OrgContext.Provider value={{ org, organizations }}>{children}</OrgContext.Provider>
  )
}

export function useAppOrg(): Organization | null {
  return useContext(OrgContext)?.org ?? null
}

export function useTenantOrganizations(): TenantPickerOrg[] {
  return useContext(OrgContext)?.organizations ?? []
}
