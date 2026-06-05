-- Añade verificación previa (sin consumir) para el código por correo

ALTER TABLE platform_security_email_challenges
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

