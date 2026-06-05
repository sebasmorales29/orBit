-- Onboarding fix: INSERT ... RETURNING on organizations failed SELECT (403)
-- because members_read_org requires organization_members row that does not exist yet.

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

  INSERT INTO organizations (name, business_type, currency, uses_stock, onboarding_completed)
  VALUES (p_name, p_business_type, p_currency, p_uses_stock, true)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) TO authenticated;
