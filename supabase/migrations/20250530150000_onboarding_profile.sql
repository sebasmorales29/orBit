-- Perfil de onboarding personalizado (preguntas guiadas)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
