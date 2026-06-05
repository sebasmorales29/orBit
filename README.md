# orBit App

App producto de orBit — Fase 1 MVP.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + RLS)

## Setup

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar migración: `supabase/migrations/20250530000001_initial_schema.sql` (ver `supabase/README.md`)
3. Copiar env vars:

```bash
cp .env.example .env.local
```

4. Instalar y correr:

```bash
npm install
npm run dev
```

App en `http://localhost:3000`

## Pantallas

| Ruta | Módulo |
|------|--------|
| `/hoy` | Panel del día (widgets + asistente IA) |
| `/ventas` | Ventas y consultas en seguimiento |
| `/consultas` | Consultas / interesados |
| `/clientes` | Clientes |
| `/stock` | Inventario y costos |
| `/metricas` | Ingresos, cobros y ganancia |
| `/integraciones` | orBit Connect (API de pedidos) |

## Estructura

```
src/
  app/
    (app)/          # Rutas autenticadas con nav
    (auth)/         # Login / signup
    onboarding/     # Wizard 5 min
  components/
  lib/
    supabase/
    hoy/            # Lógica del panel Hoy
  types/
```

## Deploy

- Frontend: Vercel
- Backend: Supabase
- Landing (separada): `../orbit/` en Vercel
