import { redirect } from 'next/navigation'

/** Pedidos abiertos viven en Ventas con filtro ?view=open */
export default function PedidosPage() {
  redirect('/ventas?view=open')
}
