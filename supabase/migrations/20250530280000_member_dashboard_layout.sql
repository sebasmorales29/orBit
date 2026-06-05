-- Cada miembro guarda su propio dashboard_layout (JSON en su fila de membership).
-- Complementa writers_update_membership: los members no-admin usan esta política (OR).

DROP POLICY IF EXISTS "member_update_own_membership" ON organization_members;

CREATE POLICY "member_update_own_dashboard" ON organization_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON COLUMN organization_members.dashboard_layout IS
  'Layout del panel Hoy (v2 sections). Personal por usuario; editable desde Dashboard Studio.';
