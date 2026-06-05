# Supabase — orBit App

## Aplicar el schema

1. Creá un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor**, pegá y ejecutá el contenido de:

   `migrations/20250530000001_initial_schema.sql`

3. Ejecutá también (fix onboarding / RLS) **en este orden**:

   - `migrations/20250530120000_onboarding_org_bootstrap.sql`
   - `migrations/20250530130000_onboarding_rls_created_by.sql`
   - `migrations/20250530140000_dashboard_layout.sql`
   - `migrations/20250530150000_onboarding_profile.sql`
   - `migrations/20250530160000_orbit_connect.sql`
   - `migrations/20250530170000_sales_natural_fields.sql`
   - `migrations/20250530180000_sales_counters_rls.sql` (si ya corriste la 170000 sin RLS)
   - `migrations/20250530190000_product_costs_profit.sql`
   - `migrations/20250530200000_platform_admin.sql` (consola CEO /ops)
   - `migrations/20250530210000_platform_ops_access.sql` (super admin + operadores /ops + MFA)
   - `migrations/20250530220000_platform_security_email_challenges.sql` (doble confirmación por correo)
   - `migrations/20250530230000_tenant_roles_and_rls.sql` (Owner/Administrator/Member + RLS)

4. Si al registrarte ves **429 / demasiados intentos**: es el límite de Auth de Supabase. **Esperá aproximadamente una hora**, usá **Iniciar sesión** si ya creaste la cuenta, o revisá el correo de confirmación.

5. En **Authentication → URL Configuration**, agregá:

   - Site URL: `http://localhost:3000` (o tu dominio de producción)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/callback?next=/reset-password`
     - (en producción, reemplazá el host por tu dominio)

6. Copiá las credenciales a `orbit-app/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...   # Settings → API → service_role (solo servidor; orBit Connect)
```

## CLI (opcional)

Si usás [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```
