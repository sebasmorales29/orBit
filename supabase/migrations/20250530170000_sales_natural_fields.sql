-- Ventas con campos naturales e ID legible por negocio

CREATE TABLE organization_sale_counters (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_number     INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE organization_sale_counters ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo assign_sale_number (SECURITY DEFINER) actualiza esta tabla.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sale_number INTEGER,
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX idx_orders_org_sale_number
  ON orders(organization_id, sale_number)
  WHERE sale_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_sale_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.sale_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO organization_sale_counters (organization_id, last_number)
  VALUES (NEW.organization_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_number = organization_sale_counters.last_number + 1
  RETURNING last_number INTO next_num;

  NEW.sale_number := next_num;

  IF NEW.subtotal IS NULL THEN
    NEW.subtotal := NEW.total;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_assign_sale_number ON orders;
CREATE TRIGGER orders_assign_sale_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.assign_sale_number();
