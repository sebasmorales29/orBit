-- Fallback si RPC no está disponible: created_by permite SELECT tras INSERT.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "authenticated_create_org" ON organizations;
CREATE POLICY "authenticated_create_org" ON organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "creator_read_org" ON organizations;
CREATE POLICY "creator_read_org" ON organizations FOR SELECT
  USING (created_by = auth.uid());

-- Asegurar función RPC (por si no corrió la migración anterior)
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  p_name TEXT,
  p_business_type TEXT,
  p_currency currency_code,
  p_uses_stock BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = v_user_id LIMIT 1) THEN
    RAISE EXCEPTION 'already_has_organization';
  END IF;

  INSERT INTO organizations (name, business_type, currency, uses_stock, onboarding_completed, created_by)
  VALUES (p_name, p_business_type, p_currency, p_uses_stock, true, v_user_id)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) TO authenticated;
