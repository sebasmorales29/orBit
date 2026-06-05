export type AuthFocusField = 'none' | 'email' | 'password'

export interface Point {
  x: number
  y: number
}

export const FORM_STREAM_TARGET: Point = { x: 388, y: 172 }

export type NetworkSceneMode = 'idle' | 'stream-email' | 'encrypt' | 'breach'

export function resolveNetworkSceneMode(
  _focusField: AuthFocusField = 'none',
  _passwordVisible = false
): NetworkSceneMode {
  return 'idle'
}

export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): Point | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const svgPt = pt.matrixTransform(ctm.inverse())
  return { x: svgPt.x, y: svgPt.y }
}

/** Micro-desplazamiento de nodos hacia el cursor */
export function nodePullToward(
  nodeX: number,
  nodeY: number,
  pointer: Point,
  strength = 0.045,
  max = 10
): Point {
  const dx = pointer.x - nodeX
  const dy = pointer.y - nodeY
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return { x: 0, y: 0 }
  const pull = Math.min(dist * strength, max)
  return {
    x: (dx / dist) * pull,
    y: (dy / dist) * pull,
  }
}
