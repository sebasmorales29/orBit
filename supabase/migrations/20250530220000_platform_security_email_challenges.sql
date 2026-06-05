-- Seguridad /ops: confirmación por correo para acciones sensibles del super admin

CREATE TABLE IF NOT EXISTS platform_security_email_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_platform_sec_ch_email ON platform_security_email_challenges (email);
CREATE INDEX IF NOT EXISTS idx_platform_sec_ch_purpose ON platform_security_email_challenges (purpose);

ALTER TABLE platform_security_email_challenges ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service role puede leer/escribir (acciones de /ops).

