-- Consola de plataforma (CEO / ops): estado del tenant, plan y revenue manual

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

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_platform_status_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_platform_status_check
  CHECK (platform_status IN ('trial', 'active', 'suspended'));

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_tier_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_tier_check
  CHECK (plan_tier IN ('trial', 'starter', 'pro', 'enterprise'));
