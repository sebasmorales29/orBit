-- Dashboard personalizable por usuario (membership)

ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS dashboard_layout JSONB;

CREATE POLICY "member_update_own_membership" ON organization_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
