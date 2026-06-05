-- Agrega rol Visitor (solo lectura estricta) a los miembros del tenant

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_role' AND e.enumlabel = 'visitor'
  ) THEN
    ALTER TYPE member_role ADD VALUE 'visitor';
  END IF;
END $$;

