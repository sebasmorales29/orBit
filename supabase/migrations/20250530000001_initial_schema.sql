-- Orbit V1 Schema — multi-tenant por organization_id

CREATE TYPE lead_status AS ENUM (
  'nuevo', 'interesado', 'cotizado', 'por_cerrar', 'ganado', 'perdido'
);

CREATE TYPE order_status AS ENUM (
  'confirmado', 'en_preparacion', 'entregado', 'cobrado', 'cancelado'
);

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE task_type AS ENUM (
  'manual', 'follow_up', 'prepare_order', 'collect_payment', 'restock'
);

CREATE TYPE currency_code AS ENUM ('CRC', 'USD');

-- ─── Organizations ───────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  business_type TEXT,
  currency      currency_code NOT NULL DEFAULT 'CRC',
  uses_stock    BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            member_role NOT NULL DEFAULT 'owner',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ─── Leads ───────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  phone            TEXT,
  product_interest TEXT,
  estimated_amount NUMERIC(12, 2),
  status           lead_status NOT NULL DEFAULT 'nuevo',
  score            INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  last_contact_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_org_status ON leads(organization_id, status);
CREATE INDEX idx_leads_org_phone ON leads(organization_id, phone);

-- ─── Customers ───────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  total_spent     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_order_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org ON customers(organization_id);

-- ─── Products ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sku             TEXT,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimum   INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimum >= 0),
  price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_org ON products(organization_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  status          order_status NOT NULL DEFAULT 'confirmado',
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid            BOOLEAN NOT NULL DEFAULT false,
  delivered_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_org_status ON orders(organization_id, status);

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── Tasks ───────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            task_type NOT NULL DEFAULT 'manual',
  title           TEXT NOT NULL,
  description     TEXT,
  due_at          TIMESTAMPTZ,
  completed       BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  priority        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_org_due ON tasks(organization_id, due_at) WHERE NOT completed;

-- ─── Message templates ───────────────────────────────────────────────────────

CREATE TABLE message_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  content         TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Activity log ──────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  description     TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_org ON activities(organization_id, created_at DESC);

-- ─── RLS helper ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid();
$$;

-- ─── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "members_read_org" ON organizations FOR SELECT
  USING (id IN (SELECT public.user_organization_ids()));

CREATE POLICY "members_update_org" ON organizations FOR UPDATE
  USING (id IN (SELECT public.user_organization_ids()));

CREATE POLICY "authenticated_create_org" ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Organization members
CREATE POLICY "members_read_membership" ON organization_members FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()) OR user_id = auth.uid());

CREATE POLICY "owner_insert_membership" ON organization_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Generic org-scoped policies
CREATE POLICY "org_select" ON leads FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON leads FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON leads FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON leads FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON customers FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON customers FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON customers FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON customers FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON products FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON products FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON products FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON products FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON orders FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON orders FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON orders FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON orders FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE organization_id IN (SELECT public.user_organization_ids())
  ));
CREATE POLICY "org_insert" ON order_items FOR INSERT
  WITH CHECK (order_id IN (
    SELECT id FROM orders WHERE organization_id IN (SELECT public.user_organization_ids())
  ));
CREATE POLICY "org_update" ON order_items FOR UPDATE
  USING (order_id IN (
    SELECT id FROM orders WHERE organization_id IN (SELECT public.user_organization_ids())
  ));
CREATE POLICY "org_delete" ON order_items FOR DELETE
  USING (order_id IN (
    SELECT id FROM orders WHERE organization_id IN (SELECT public.user_organization_ids())
  ));

CREATE POLICY "org_select" ON tasks FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON tasks FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON tasks FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON tasks FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON message_templates FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON message_templates FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_update" ON message_templates FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_delete" ON message_templates FOR DELETE
  USING (organization_id IN (SELECT public.user_organization_ids()));

CREATE POLICY "org_select" ON activities FOR SELECT
  USING (organization_id IN (SELECT public.user_organization_ids()));
CREATE POLICY "org_insert" ON activities FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_organization_ids()));

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
