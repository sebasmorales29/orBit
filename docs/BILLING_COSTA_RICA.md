# Pagos y suscripciones en Costa Rica (orBit)

Stripe no opera como pasarela directa para negocios costarricenses. Estas son opciones viables para SaaS con cobros recurrentes:

## Integrado: **Tilopay** (recomendado en orBit)

- Cobros recurrentes, SINPE, Yappy, tarjetas.
- API redirect: `POST https://app.tilopay.com/api/v1/processPayment`
- Credenciales en: https://admin.tilopay.com/admin/checkout
- Variables:
  - `TILOPAY_API_KEY`
  - `TILOPAY_API_USER`
  - `TILOPAY_API_PASSWORD`
  - `ORBIT_BILLING_PROVIDER=tilopay` (opcional, fuerza proveedor)
- Retorno de pago: `GET /api/billing/confirm` (Tilopay redirige con `code`, `order`, `OrderHash`, etc.)
- Webhook opcional: `POST /api/billing/webhook/tilopay`

## Alternativa: **Onvo Pay**

- Empresa enfocada en CR y LATAM.
- Variable: `ONVO_SECRET_KEY`
- Webhook: `POST /api/billing/webhook/onvo`

## Otras opciones

| Proveedor | Notas |
|-----------|--------|
| **PayPal** | Fácil de integrar; retirar fondos a CR suele requerir cuentas en el exterior o terceros con comisión alta. |
| **2Checkout (Verifone)** | Internacional, acepta compradores CR. |
| **Paddle / Lemon Squeezy** | Merchant of record; útil si facturás desde entidad fuera de CR. |

## Desarrollo local (sin claves)

Sin credenciales de pago, el flujo usa **modo simulado**. En desarrollo, si Tilopay falla también cae a simulado.

## Variables de entorno

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
TILOPAY_API_KEY=xxxx-xxxx-xxxx
TILOPAY_API_USER=tu_api_user
TILOPAY_API_PASSWORD=tu_api_password
ORBIT_BILLING_SECRET=un-secreto-largo-para-firmar-tokens
ORBIT_BILLING_PROVIDER=tilopay
```

## Renovaciones automáticas

Cron diario (Vercel Cron o similar):

```bash
curl -X POST https://tu-dominio.com/api/cron/billing-renewals \
  -H "Authorization: Bearer $CRON_SECRET"
```

Cobra con Tilopay `processRecurrentPayment` usando el token guardado (`payment_customer_id`).

## Gestión self-service

En **Ajustes → Facturación** el dueño puede:

- Ver plan, ciclo, próxima renovación
- Cambiar plan o ciclo (inmediato si es upgrade; programado si es downgrade)
- Actualizar tarjeta
- Cancelar al final del período

## Migración SQL

Ejecutá en Supabase:

- `20250530310000_subscription_payment.sql`
- `20250530320000_subscription_recurring.sql`
