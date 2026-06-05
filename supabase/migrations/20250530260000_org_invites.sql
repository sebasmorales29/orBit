-- Invitaciones a tenants: estado Pendiente/Miembro + token

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | member | revoked | expired
  token TEXT NOT NULL,
  temp_password_set BOOLEAN NOT NULL DEFAULT false,
  invited_by_user_id UUID,
  invited_by_email TEXT,
  invited_by_name TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (organization_id, email),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON organization_invites (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites (email);

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service role (/ops) accede.

