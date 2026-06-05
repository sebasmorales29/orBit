# Cron de renovaciones — paso a paso

## ¿Qué es `CRON_SECRET`?

**No viene de Tilopay, Supabase ni de ningún panel.** Es una contraseña que **vos inventás** para que solo tu servidor (o Vercel) pueda llamar al endpoint de renovaciones. Nadie más debería poder ejecutarlo.

Es lo mismo que `ORBIT_BILLING_SECRET`: un string largo y aleatorio que guardás en variables de entorno.

### Generar uno (en la terminal)

```bash
openssl rand -hex 32
```

Copiá el resultado. Ejemplo (no uses este, generá el tuyo):

```
a3f8c2e1b9d0476f8e2a1c5b4d3e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5
```

---

## 1. Local (`.env.local`)

En `orbit-app/.env.local` agregá:

```env
CRON_SECRET=pegá-acá-el-string-que-generaste
```

Reiniciá `npm run dev`.

### Probar a mano en local

```bash
curl -X POST http://localhost:3000/api/cron/billing-renewals \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Si el secret coincide, respondés algo como `{"processed":0,"results":[]}`.  
`processed: 0` es normal si ningún tenant tiene la renovación vencida hoy.

---

## 2. Producción en Vercel (recomendado)

El repo ya incluye `vercel.json` con un cron **diario a las 08:00 UTC** (~2:00 a.m. Costa Rica en horario estándar).

### Pasos

1. **Vercel** → tu proyecto orBit → **Settings** → **Environment Variables**
2. Agregá:
   - Name: `CRON_SECRET`
   - Value: el mismo string que generaste
   - Environments: Production (y Preview si querés)
3. **Deploy** de nuevo (para que tome `vercel.json` y la variable).

Vercel llama solo a `/api/cron/billing-renewals` y envía el header:

`Authorization: Bearer <valor de CRON_SECRET>`

No tenés que configurar el header a mano en Vercel.

### Ver que corre

Vercel → **Logs** → filtrá por `/api/cron/billing-renewals` después de la hora programada.

---

## 3. Si NO usás Vercel

Cualquier programador de tareas que pueda hacer un HTTP POST diario sirve:

| Servicio | Qué hacés |
|----------|-----------|
| [cron-job.org](https://cron-job.org) | URL + header `Authorization: Bearer TU_CRON_SECRET` |
| GitHub Actions | workflow `schedule:` con `curl` |
| Supabase Edge Function + pg_cron | más avanzado |

Ejemplo cron-job.org:

- URL: `https://tu-dominio.com/api/cron/billing-renewals`
- Método: POST
- Header: `Authorization` = `Bearer TU_CRON_SECRET`
- Frecuencia: una vez al día

---

## ¿Cuándo cobra de verdad?

Solo a tenants con:

- `subscription_status` = `active` o `past_due`
- `subscription_next_billing_at` **ya pasó** (fecha ≤ hoy)
- `subscription_cancel_at_period_end` = false
- `payment_customer_id` con token de Tilopay guardado

Si recién activaste un plan anual, el primer cobro automático será **dentro de 12 meses** (o el ciclo que hayas elegido).
