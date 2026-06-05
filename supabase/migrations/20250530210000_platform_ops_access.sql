-- Acceso /ops: super admin (env) + operadores delegados en BD

CREATE TABLE IF NOT EXISTS platform_ops_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID,
  mfa_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT platform_ops_admins_email_unique UNIQUE (email),
  CONSTRAINT platform_ops_admins_email_lowercase CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS idx_platform_ops_admins_email ON platform_ops_admins (email);

ALTER TABLE platform_ops_admins ENABLE ROW LEVEL SECURITY;

-- Sin políticas para authenticated: solo service role (consola /ops) accede.
