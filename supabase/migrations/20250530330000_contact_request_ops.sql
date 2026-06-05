-- Ops: archivar, notas y seguimiento en solicitudes de contacto.

ALTER TABLE platform_contact_requests
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ops_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS platform_contact_requests_archived_created
  ON platform_contact_requests (archived_at, created_at DESC);
