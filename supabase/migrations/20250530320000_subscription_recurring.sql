-- Renovaciones, cambios de plan/ciclo y historial de cobros.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_next_billing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_scheduled_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_scheduled_cycle TEXT,
  ADD COLUMN IF NOT EXISTS billing_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS pending_billing_action JSONB;

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_scheduled_plan_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_scheduled_plan_check
  CHECK (
    subscription_scheduled_plan IS NULL
    OR subscription_scheduled_plan IN ('operativo', 'profesional', 'equipo')
  );

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_scheduled_cycle_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_scheduled_cycle_check
  CHECK (
    subscription_scheduled_cycle IS NULL
    OR subscription_scheduled_cycle IN ('monthly', 'semiannual', 'annual')
  );

CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  plan_id TEXT,
  billing_cycle TEXT,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_provider TEXT,
  payment_checkout_id TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_org_created_idx
  ON billing_events (organization_id, created_at DESC);

ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_event_type_check;
ALTER TABLE billing_events
  ADD CONSTRAINT billing_events_event_type_check
  CHECK (
    event_type IN (
      'activation',
      'renewal',
      'plan_change',
      'cycle_change',
      'payment_failed',
      'canceled',
      'reactivated',
      'card_update',
      'scheduled_change'
    )
  );

ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_status_check;
ALTER TABLE billing_events
  ADD CONSTRAINT billing_events_status_check
  CHECK (status IN ('succeeded', 'failed', 'pending', 'scheduled'));

-- Backfill: tenants activos sin período definido
UPDATE organizations o
SET
  subscription_current_period_start = COALESCE(o.subscription_activated_at, o.created_at),
  subscription_current_period_end = COALESCE(o.subscription_activated_at, o.created_at)
    + CASE COALESCE(o.billing_cycle, 'annual')
        WHEN 'monthly' THEN INTERVAL '1 month'
        WHEN 'semiannual' THEN INTERVAL '6 months'
        ELSE INTERVAL '12 months'
      END,
  subscription_next_billing_at = COALESCE(o.subscription_activated_at, o.created_at)
    + CASE COALESCE(o.billing_cycle, 'annual')
        WHEN 'monthly' THEN INTERVAL '1 month'
        WHEN 'semiannual' THEN INTERVAL '6 months'
        ELSE INTERVAL '12 months'
      END,
  billing_amount_cents = (
    ROUND(
      CASE COALESCE(o.selected_plan, 'profesional')
        WHEN 'operativo' THEN 38
        WHEN 'equipo' THEN 68
        ELSE 49
      END::numeric
      * CASE COALESCE(o.billing_cycle, 'annual')
          WHEN 'monthly' THEN 1
          WHEN 'semiannual' THEN 0.88
          ELSE 0.82
        END
    )
    * CASE COALESCE(o.billing_cycle, 'annual')
        WHEN 'monthly' THEN 1
        WHEN 'semiannual' THEN 6
        ELSE 12
      END
    * 100
  )::integer
WHERE o.subscription_status = 'active'
  AND o.subscription_current_period_end IS NULL;
