'use client'

import { useEffect } from 'react'
import { applyBrandThemeToDocument, parseBrandTheme } from '@/lib/onboarding/brand-theme'
import type { Organization } from '@/types/database'

export function TenantThemeProvider({ org, children }: { org: Organization; children: React.ReactNode }) {
  useEffect(() => {
    const theme = parseBrandTheme(org.brand_theme)
    applyBrandThemeToDocument(theme)
    return () => {
      document.documentElement.style.removeProperty('--accent')
      document.documentElement.style.removeProperty('--accent-soft')
      document.documentElement.style.removeProperty('--selection')
      delete document.documentElement.dataset.tenantAccent
    }
  }, [org.brand_theme])

  return children
}
