import { createAdminClient } from '@/lib/supabase/admin'

export type SchemaHealthResult =
  | { ok: true }
  | {
      ok: false
      missingColumns: string[]
      sqlFix: string
    }

const REQUIRED_ORG_COLUMNS = [
  'onboarding_profile',
  'platform_status',
  'plan_tier',
  'monthly_fee_cents',
] as const

const OPS_ACCESS_SQL = `-- Acceso delegado /ops (opcional si solo usás super admin)
CREATE TABLE IF NOT EXISTS platform_ops_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID,
  mfa_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT platform_ops_admins_email_unique UNIQUE (email),
  CONSTRAINT platform_ops_admins_email_lowercase CHECK (email = lower(email))
);
ALTER TABLE platform_ops_admins ENABLE ROW LEVEL SECURITY;
`

const FIX_SQL = `-- Ejecutá en Supabase → SQL Editor (migraciones pendientes)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS platform_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'trial';

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS monthly_fee_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS platform_notes TEXT;
`

export async function checkPlatformSchema(): Promise<SchemaHealthResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { ok: true }
  }

  const missing: string[] = []

  for (const col of REQUIRED_ORG_COLUMNS) {
    const { error } = await admin.from('organizations').select(col).limit(1)
    if (error?.message?.includes('does not exist')) {
      missing.push(col)
    }
  }

  const { error: layoutError } = await admin
    .from('organization_members')
    .select('dashboard_layout')
    .limit(1)
  if (layoutError?.message?.includes('does not exist')) {
    missing.push('organization_members.dashboard_layout')
  }

  if (missing.length > 0) {
    return { ok: false, missingColumns: missing, sqlFix: FIX_SQL }
  }

  return { ok: true }
}
