-- orBit Connect: conexiones entrantes (tienda online, webhooks, apps externas)

CREATE TYPE integration_provider AS ENUM (
  'custom',
  'webhook',
  'shopify',
  'woocommerce',
  'tiendanube',
  'other_store'
);

CREATE TABLE integration_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  provider          integration_provider NOT NULL DEFAULT 'custom',
  secret_hash       TEXT NOT NULL,
  secret_prefix     TEXT NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT true,
  settings          JSONB NOT NULL DEFAULT '{}',
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_connections_org ON integration_connections(organization_id);
CREATE UNIQUE INDEX idx_integration_connections_prefix ON integration_connections(secret_prefix);

CREATE TABLE integration_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id     UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  direction         TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event_type        TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('success', 'error', 'duplicate')),
  external_id       TEXT,
  payload           JSONB NOT NULL DEFAULT '{}',
  result            JSONB NOT NULL DEFAULT '{}',
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_events_org ON integration_events(organization_id, created_at DESC);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_source TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX idx_orders_external_unique
  ON orders(organization_id, external_source, external_id)
  WHERE external_id IS NOT NULL AND external_source IS NOT NULL;

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON integration_connections FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_insert" ON integration_connections FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_update" ON integration_connections FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_delete" ON integration_connections FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON integration_events FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE TRIGGER integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
