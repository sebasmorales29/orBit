-- Self-service: dueño de suscripción, branding por tenant, origen y plan elegido.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provisioned_source TEXT NOT NULL DEFAULT 'self_service',
  ADD COLUMN IF NOT EXISTS selected_plan TEXT,
  ADD COLUMN IF NOT EXISTS brand_theme JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_provisioned_source_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_provisioned_source_check
  CHECK (provisioned_source IN ('self_service', 'ops'));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_selected_plan_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_selected_plan_check
  CHECK (
    selected_plan IS NULL OR selected_plan IN ('operativo', 'profesional', 'equipo')
  );

-- Dueño histórico = primer miembro con rol owner
UPDATE organizations o
SET subscription_owner_id = sub.user_id
FROM (
  SELECT DISTINCT ON (organization_id) organization_id, user_id
  FROM organization_members
  WHERE role = 'owner'
  ORDER BY organization_id, user_id
) sub
WHERE o.id = sub.organization_id
  AND o.subscription_owner_id IS NULL;

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

  INSERT INTO organizations (
    name,
    business_type,
    currency,
    uses_stock,
    onboarding_completed,
    created_by,
    subscription_owner_id,
    provisioned_source,
    platform_status,
    plan_tier
  )
  VALUES (
    p_name,
    p_business_type,
    p_currency,
    p_uses_stock,
    false,
    v_user_id,
    v_user_id,
    'self_service',
    'trial',
    'trial'
  )
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(TEXT, TEXT, currency_code, BOOLEAN) TO authenticated;
