-- Solicitudes de contacto desde el landing (ventas / demos)
CREATE TABLE IF NOT EXISTS platform_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role_title TEXT,
  team_size TEXT,
  interest TEXT,
  message TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'email',
  locale TEXT DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'closed')),
  source TEXT NOT NULL DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_contact_requests_email_lowercase CHECK (email = lower(email))
);

CREATE INDEX IF NOT EXISTS platform_contact_requests_status_created
  ON platform_contact_requests (status, created_at DESC);

ALTER TABLE platform_contact_requests ENABLE ROW LEVEL SECURITY;

-- Sin políticas para anon/authenticated: solo service role (ops) inserta/lee vía admin client.

-- Acceso y URL pública por tenant
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS max_members INTEGER,
  ADD COLUMN IF NOT EXISTS allowed_email_domains TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_url_published BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique
  ON organizations (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN organizations.slug IS 'Identificador URL: /t/{slug}';
COMMENT ON COLUMN organizations.max_members IS 'NULL = sin límite';
COMMENT ON COLUMN organizations.allowed_email_domains IS 'Dominios permitidos (@empresa.com); vacío = cualquiera';
COMMENT ON COLUMN organizations.public_url_published IS 'Si true, /t/{slug} es accesible públicamente';
