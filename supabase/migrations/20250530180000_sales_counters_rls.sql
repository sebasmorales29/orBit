-- RLS para contadores de venta (la migración 170000 no lo incluía).
-- Solo el trigger assign_sale_number (SECURITY DEFINER) escribe aquí; usuarios no acceden directo.

ALTER TABLE organization_sale_counters ENABLE ROW LEVEL SECURITY;

-- Sin políticas = ningún rol (authenticated/anon) puede leer ni escribir por API.
-- El trigger BEFORE INSERT en orders sigue asignando sale_number con SECURITY DEFINER.
