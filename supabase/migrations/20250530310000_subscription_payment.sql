-- Suscripción: estado de pago y proveedor (Onvo / Tilopay / manual ops).

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ;

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('pending_payment', 'active', 'past_due', 'canceled'));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_billing_cycle_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_billing_cycle_check
  CHECK (
    billing_cycle IS NULL OR billing_cycle IN ('monthly', 'semiannual', 'annual')
  );

-- Tenants ya operativos (ops o históricos) quedan activos
UPDATE organizations
SET subscription_status = 'active',
    subscription_activated_at = COALESCE(subscription_activated_at, created_at)
WHERE onboarding_completed = true
  AND subscription_status = 'pending_payment';
