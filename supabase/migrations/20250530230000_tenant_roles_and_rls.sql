-- Roles por tenant: Owner / Administrator / Member
-- Cambios:
-- - Renombra member_role.admin -> member_role.administrator
-- - Endurece RLS: Member solo lectura; Owner/Administrator pueden escribir.

-- 1) Renombrar el valor del ENUM (mantiene datos existentes)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_role' AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE member_role RENAME VALUE 'admin' TO 'administrator';
  END IF;
END $$;

-- 2) Helper: ¿el usuario actual tiene rol admin/owner en el org?
CREATE OR REPLACE FUNCTION public.has_org_write_access(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'administrator')
  );
$$;

REVOKE ALL ON FUNCTION public.has_org_write_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_org_write_access(uuid) TO authenticated;

-- 3) Organizations: update solo con write access
DROP POLICY IF EXISTS "members_update_org" ON organizations;
CREATE POLICY "writers_update_org" ON organizations FOR UPDATE
  USING (public.has_org_write_access(id));

-- 4) Membership: permitir insertar membresías a owner/administrator
DROP POLICY IF EXISTS "owner_insert_membership" ON organization_members;
CREATE POLICY "writers_insert_membership" ON organization_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'administrator')
    )
  );

-- Evitar que members editen membresías (solo writers)
DROP POLICY IF EXISTS "org_update" ON organization_members;
DROP POLICY IF EXISTS "org_delete" ON organization_members;
CREATE POLICY "writers_update_membership" ON organization_members FOR UPDATE
  USING (organization_id IN (SELECT public.user_organization_ids()))
  WITH CHECK (public.has_org_write_access(organization_id));

CREATE POLICY "writers_delete_membership" ON organization_members FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- 5) Tablas por org: inserts/updates/deletes solo writers
-- Leads
DROP POLICY IF EXISTS "org_insert" ON leads;
DROP POLICY IF EXISTS "org_update" ON leads;
DROP POLICY IF EXISTS "org_delete" ON leads;
CREATE POLICY "writers_insert" ON leads FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON leads FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON leads FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Customers
DROP POLICY IF EXISTS "org_insert" ON customers;
DROP POLICY IF EXISTS "org_update" ON customers;
DROP POLICY IF EXISTS "org_delete" ON customers;
CREATE POLICY "writers_insert" ON customers FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON customers FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON customers FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Products
DROP POLICY IF EXISTS "org_insert" ON products;
DROP POLICY IF EXISTS "org_update" ON products;
DROP POLICY IF EXISTS "org_delete" ON products;
CREATE POLICY "writers_insert" ON products FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON products FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON products FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Orders
DROP POLICY IF EXISTS "org_insert" ON orders;
DROP POLICY IF EXISTS "org_update" ON orders;
DROP POLICY IF EXISTS "org_delete" ON orders;
CREATE POLICY "writers_insert" ON orders FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON orders FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON orders FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Order items: derivar org desde orders
DROP POLICY IF EXISTS "org_insert" ON order_items;
DROP POLICY IF EXISTS "org_update" ON order_items;
DROP POLICY IF EXISTS "org_delete" ON order_items;
CREATE POLICY "writers_insert" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND public.has_org_write_access(o.organization_id)
    )
  );
CREATE POLICY "writers_update" ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND public.has_org_write_access(o.organization_id)
    )
  );
CREATE POLICY "writers_delete" ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND public.has_org_write_access(o.organization_id)
    )
  );

-- Tasks
DROP POLICY IF EXISTS "org_insert" ON tasks;
DROP POLICY IF EXISTS "org_update" ON tasks;
DROP POLICY IF EXISTS "org_delete" ON tasks;
CREATE POLICY "writers_insert" ON tasks FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON tasks FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON tasks FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Templates
DROP POLICY IF EXISTS "org_insert" ON message_templates;
DROP POLICY IF EXISTS "org_update" ON message_templates;
DROP POLICY IF EXISTS "org_delete" ON message_templates;
CREATE POLICY "writers_insert" ON message_templates FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON message_templates FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON message_templates FOR DELETE
  USING (public.has_org_write_access(organization_id));

-- Activities
DROP POLICY IF EXISTS "org_insert" ON activities;
DROP POLICY IF EXISTS "org_update" ON activities;
DROP POLICY IF EXISTS "org_delete" ON activities;
CREATE POLICY "writers_insert" ON activities FOR INSERT
  WITH CHECK (public.has_org_write_access(organization_id));
CREATE POLICY "writers_update" ON activities FOR UPDATE
  USING (public.has_org_write_access(organization_id));
CREATE POLICY "writers_delete" ON activities FOR DELETE
  USING (public.has_org_write_access(organization_id));

