import type { BusinessVertical } from '@/lib/business-context/types'

interface TemplateSeed {
  name: string
  category: string
  content: string
}

const BASE: TemplateSeed[] = [
  {
    name: 'Seguimiento',
    category: 'follow_up',
    content:
      '¡Hola {nombre}! 👋 Te escribo para saber si seguís interesado/a en {producto}. ¿Te ayudo con algo?',
  },
  {
    name: 'Confirmación',
    category: 'order',
    content:
      '¡Listo, {nombre}! Quedó confirmado por {monto}. Te aviso en cuanto esté listo 🚀',
  },
  {
    name: 'Recordatorio de cobro',
    category: 'payment',
    content:
      'Hola {nombre}, te recuerdo el saldo de {monto}. ¿Podés confirmarme el pago cuando puedas? 🙏',
  },
]

const BY_VERTICAL: Partial<Record<BusinessVertical, TemplateSeed[]>> = {
  food: [
    {
      name: 'Pedido listo',
      category: 'order',
      content: '¡{nombre}! Tu pedido ya está listo para retirar/entrega. ¡Gracias por elegirnos! 🍽️',
    },
  ],
  beauty: [
    {
      name: 'Recomendación personalizada',
      category: 'follow_up',
      content:
        'Hola {nombre} ✨ Según lo que me contaste, {producto} te vendría perfecto. ¿Te reservo uno?',
    },
  ],
  services: [
    {
      name: 'Propuesta de servicio',
      category: 'follow_up',
      content:
        'Hola {nombre}, te comparto la propuesta por {monto}. Cuando quieras la afinamos juntos.',
    },
  ],
  apparel: [
    {
      name: 'Talla y disponibilidad',
      category: 'follow_up',
      content: '¡Hola {nombre}! Tenemos {producto} — ¿qué talla necesitás?',
    },
  ],
  barber: [
    {
      name: 'Confirmar cita',
      category: 'order',
      content: '¡Hola {nombre}! Te confirmo tu cita. Te esperamos 💈',
    },
  ],
  perfumes: [
    {
      name: 'Muestra disponible',
      category: 'follow_up',
      content: 'Hola {nombre} — ya tenemos {producto} para que lo pruebes. ¿Te aparto uno?',
    },
  ],
  jewelry: [
    {
      name: 'Apartado',
      category: 'follow_up',
      content: '¡{nombre}! Te aparté {producto}. ¿Confirmamos con {monto}?',
    },
  ],
  retail: [
    {
      name: 'Disponibilidad',
      category: 'follow_up',
      content: 'Hola {nombre}, sí tenemos {producto} — ¿te lo separo?',
    },
  ],
}

export function templatesForVertical(vertical: string): TemplateSeed[] {
  const extra = BY_VERTICAL[vertical as BusinessVertical] ?? []
  return [...BASE, ...extra]
}
