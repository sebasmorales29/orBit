# Velum

CRM operativo para PYMEs — capa fina que ordena consultas, ventas, inventario y cobros.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + RLS)

## Setup

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar migraciones en `supabase/migrations/` (ver `supabase/README.md`)
3. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

4. Instalar y correr:

```bash
npm install
npm run dev
```

App en `http://localhost:3000`

## Marca y variables

- Nombre de producto: **Velum**
- Integraciones: **Velum Connect** (`/api/connect/v1/orders`)
- Consola interna: `/ops` (**Velum Platform**)
- Variables de entorno nuevas usan prefijo `VELUM_*`; `ORBIT_*` sigue como fallback.

## Documentación

- `docs/BILLING_COSTA_RICA.md`
- `docs/CRON_RENOVACIONES.md`
