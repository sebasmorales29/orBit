'use client'

import { useEffect, useRef, useState } from 'react'
import { clientToSvgPoint, type Point } from '@/components/auth/auth-scene'

const LERP = 0.14
const DEFAULT_SVG: Point = { x: 200, y: 170 }
const DEFAULT_PCT: Point = { x: 50, y: 50 }
const DEFAULT_PX: Point = { x: 0, y: 0 }

export function useSmoothPointer(
  containerRef: React.RefObject<HTMLElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  enabled: boolean
) {
  const targetSvgRef = useRef<Point>(DEFAULT_SVG)
  const targetPctRef = useRef<Point>(DEFAULT_PCT)
  const targetPxRef = useRef<Point>(DEFAULT_PX)
  const smoothSvgRef = useRef<Point>({ ...DEFAULT_SVG })
  const smoothPctRef = useRef<Point>({ ...DEFAULT_PCT })
  const smoothPxRef = useRef<Point>({ ...DEFAULT_PX })
  const [svgPoint, setSvgPoint] = useState<Point>(DEFAULT_SVG)
  const [pctPoint, setPctPoint] = useState<Point>(DEFAULT_PCT)
  const [pxPoint, setPxPoint] = useState<Point>(DEFAULT_PX)
  const hasPointerRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      const container = containerRef.current
      const svg = svgRef.current
      if (!container || !svg) return

      const rect = container.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return

      targetPctRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      }
      targetPxRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const pt = clientToSvgPoint(svg, e.clientX, e.clientY)
      if (!pt) return
      targetSvgRef.current = pt
      hasPointerRef.current = true
    }

    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const tick = () => {
      if (hasPointerRef.current) {
        const ts = targetSvgRef.current
        const ss = smoothSvgRef.current
        ss.x += (ts.x - ss.x) * LERP
        ss.y += (ts.y - ss.y) * LERP
        setSvgPoint({ x: ss.x, y: ss.y })

        const tp = targetPctRef.current
        const sp = smoothPctRef.current
        sp.x += (tp.x - sp.x) * LERP
        sp.y += (tp.y - sp.y) * LERP
        setPctPoint({ x: sp.x, y: sp.y })

        const tpx = targetPxRef.current
        const spx = smoothPxRef.current
        spx.x += (tpx.x - spx.x) * LERP
        spx.y += (tpx.y - spx.y) * LERP
        setPxPoint({ x: spx.x, y: spx.y })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [enabled, containerRef, svgRef])

  return { svg: svgPoint, pct: pctPoint, px: pxPoint }
}
