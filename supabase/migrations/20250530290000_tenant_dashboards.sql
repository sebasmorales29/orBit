-- Paneles guardados por tenant (públicos o privados por creador)

CREATE TABLE IF NOT EXISTS tenant_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_dashboards_name_len CHECK (char_length(trim(name)) >= 1)
);

CREATE INDEX IF NOT EXISTS tenant_dashboards_org_visibility
  ON tenant_dashboards (organization_id, visibility);

CREATE INDEX IF NOT EXISTS tenant_dashboards_created_by
  ON tenant_dashboards (created_by);

ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS active_dashboard_id UUID REFERENCES tenant_dashboards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS organization_members_active_dashboard
  ON organization_members (active_dashboard_id)
  WHERE active_dashboard_id IS NOT NULL;

ALTER TABLE tenant_dashboards ENABLE ROW LEVEL SECURITY;

-- Ver: públicos del tenant + mis privados
CREATE POLICY "tenant_dashboards_select" ON tenant_dashboards FOR SELECT
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND (
      visibility = 'public'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "tenant_dashboards_insert" ON tenant_dashboards FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "tenant_dashboards_update" ON tenant_dashboards FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "tenant_dashboards_delete" ON tenant_dashboards FOR DELETE
  USING (created_by = auth.uid());

COMMENT ON TABLE tenant_dashboards IS
  'Biblioteca de layouts del panel Hoy. public = visible para todo el tenant; private = solo el creador.';
