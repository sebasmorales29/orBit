'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type AuthFocusField,
  FORM_STREAM_TARGET,
  nodePullToward,
  resolveNetworkSceneMode,
  type NetworkSceneMode,
  type Point,
} from '@/components/auth/auth-scene'
import { useSmoothPointer } from '@/components/auth/use-smooth-svg-pointer'

interface AuthNetworkSceneProps {
  focusField: AuthFocusField
  passwordVisible: boolean
}

interface NodeDef {
  id: string
  x: number
  y: number
  r: number
  core?: boolean
  relay?: boolean
}

const NODES: NodeDef[] = [
  { id: 'core', x: 200, y: 168, r: 30, core: true },
  { id: 'hoy', x: 88, y: 108, r: 20 },
  { id: 'ventas', x: 118, y: 262, r: 20 },
  { id: 'pedidos', x: 292, y: 258, r: 20 },
  { id: 'stock', x: 318, y: 108, r: 20 },
  { id: 'relay-a', x: 155, y: 148, r: 10, relay: true },
  { id: 'relay-b', x: 252, y: 188, r: 10, relay: true },
  { id: 'relay-c', x: 248, y: 128, r: 8, relay: true },
]

const EDGES: [string, string][] = [
  ['core', 'hoy'],
  ['core', 'ventas'],
  ['core', 'pedidos'],
  ['core', 'stock'],
  ['hoy', 'ventas'],
  ['ventas', 'pedidos'],
  ['pedidos', 'stock'],
  ['stock', 'hoy'],
  ['core', 'relay-a'],
  ['relay-a', 'hoy'],
  ['relay-a', 'ventas'],
  ['core', 'relay-b'],
  ['relay-b', 'pedidos'],
  ['relay-b', 'stock'],
  ['relay-c', 'stock'],
  ['relay-c', 'relay-b'],
  ['hoy', 'relay-c'],
]

function nodeById(id: string) {
  const n = NODES.find((x) => x.id === id)
  if (!n) throw new Error(`Unknown node ${id}`)
  return n
}

function NetworkNode({
  node,
  pull,
  mode,
  active,
}: {
  node: NodeDef
  pull: Point
  mode: NetworkSceneMode
  active: boolean
}) {
  const breach = mode === 'breach'
  const encrypt = mode === 'encrypt'

  return (
    <g transform={`translate(${node.x + pull.x}, ${node.y + pull.y})`}>
      {node.core && (
        <>
          <g className="animate-[spin_24s_linear_infinite]">
            <circle
              r={node.r + 18}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1"
              opacity={0.2}
            />
          </g>
          <g className="animate-[spin_16s_linear_infinite_reverse]">
            <circle
              r={node.r + 10}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              opacity={0.45}
            />
          </g>
        </>
      )}

      <circle
        r={node.r + 4}
        fill="var(--color-accent)"
        opacity={active ? 0.22 : 0.08}
        className="transition-opacity duration-300"
      />

      <circle
        r={node.r}
        fill={node.core ? 'var(--color-accent)' : 'var(--color-surface-hover)'}
        stroke={
          breach && node.core
            ? '#ef4444'
            : encrypt
              ? 'var(--color-muted-foreground)'
              : 'var(--color-accent)'
        }
        strokeWidth={node.core ? 0 : 1.5}
        opacity={encrypt && !node.core ? 0.85 : 1}
        className={breach && node.core ? 'animate-pulse' : 'transition-all duration-300'}
      />

      {node.core ? (
        <circle r={8} fill="var(--color-on-accent)" opacity={0.9} />
      ) : (
        <circle
          r={node.relay ? 3 : 4}
          fill="var(--color-accent)"
          opacity={node.relay ? 0.85 : 0.95}
        />
      )}

      {encrypt && node.core && (
        <circle
          r={node.r + 6}
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity={0.6}
          className="auth-mesh-dash-slow"
        />
      )}
    </g>
  )
}

function DataLink({
  from,
  to,
  mode,
  highlight,
  index,
}: {
  from: Point
  to: Point
  mode: NetworkSceneMode
  highlight: boolean
  index: number
}) {
  const breach = mode === 'breach'
  const encrypt = mode === 'encrypt'
  const stream = mode === 'stream-email'

  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const bend = index % 2 === 0 ? 12 : -12
  const path = `M ${from.x} ${from.y} Q ${midX + bend} ${midY - bend} ${to.x} ${to.y}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={
          breach
            ? 'rgb(239 68 68 / 0.55)'
            : highlight
              ? 'var(--color-accent)'
              : 'var(--color-border)'
        }
        strokeWidth={highlight ? 1.8 : 1}
        strokeDasharray={encrypt ? '3 7' : stream && highlight ? '6 10' : undefined}
        opacity={encrypt ? 0.5 : highlight ? 0.95 : 0.55}
        className={
          stream && highlight
            ? 'auth-mesh-dash'
            : encrypt
              ? 'auth-mesh-dash-slow'
              : breach
                ? 'animate-pulse'
                : undefined
        }
      />
      {(stream && highlight) || mode === 'idle' ? (
        <circle r={2.5} fill="var(--color-accent)" opacity={highlight ? 1 : 0.35}>
          <animateMotion
            dur={highlight ? '1.4s' : '3.2s'}
            repeatCount="indefinite"
            path={path}
            begin={`${(index * 0.21) % 1.8}s`}
          />
        </circle>
      ) : null}
    </g>
  )
}

export function AuthNetworkScene({ focusField, passwordVisible }: AuthNetworkSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const mode = resolveNetworkSceneMode(focusField, passwordVisible)
  const trackPointer = !reducedMotion
  const { svg: pointer, px: glowPx } = useSmoothPointer(
    containerRef,
    svgRef,
    trackPointer
  )

  /** Halo extendido; el clip lo hace solo la tarjeta exterior */
  const GLOW_BLEED = 80

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const pulls = useMemo(() => {
    if (reducedMotion || mode !== 'idle') {
      return Object.fromEntries(NODES.map((n) => [n.id, { x: 0, y: 0 }]))
    }
    return Object.fromEntries(
      NODES.map((n) => [n.id, nodePullToward(n.x, n.y, pointer)])
    )
  }, [pointer, reducedMotion, mode])

  const streamTarget =
    mode === 'stream-email' ? FORM_STREAM_TARGET : null

  const showGlow = trackPointer && mode === 'idle'

  return (
    <div
      ref={containerRef}
      className="relative size-full min-h-[200px] min-w-0 flex-1"
      aria-hidden
    >
      {showGlow && (
        <div
          className="pointer-events-none absolute z-0"
          style={{ inset: -GLOW_BLEED }}
        >
          <div
            className="absolute h-48 w-48 -translate-x-1/2 -translate-y-1/2 will-change-[left,top]"
            style={{
              left: glowPx.x + GLOW_BLEED,
              top: glowPx.y + GLOW_BLEED,
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 36%, transparent) 0%, transparent 70%)',
              filter: 'blur(32px)',
            }}
          />
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 400 340"
        className="relative z-[1] size-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="auth-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </pattern>
        </defs>

        <rect width="400" height="340" fill="url(#auth-grid)" />

        {/* Anillo orbital global */}
        <g transform="translate(200, 170)" className={mode === 'idle' ? 'animate-[spin_40s_linear_infinite]' : ''}>
          <ellipse
            cx="0"
            cy="0"
            rx="168"
            ry="58"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1"
            opacity={mode === 'breach' ? 0.35 : 0.15}
            strokeDasharray="2 6"
            transform="rotate(-14)"
          />
        </g>

        <g>
          {EDGES.map(([a, b], i) => {
            const na = nodeById(a)
            const nb = nodeById(b)
            const pa = pulls[a] ?? { x: 0, y: 0 }
            const pb = pulls[b] ?? { x: 0, y: 0 }
            const from = { x: na.x + pa.x, y: na.y + pa.y }
            const to = { x: nb.x + pb.x, y: nb.y + pb.y }

            const highlight =
              mode === 'stream-email' &&
              (a === 'core' || b === 'core' || a === 'relay-b' || b === 'relay-b')

            return (
              <DataLink
                key={`${a}-${b}`}
                from={from}
                to={to}
                mode={mode}
                highlight={!!highlight}
                index={i}
              />
            )
          })}

          {streamTarget && (
            <DataLink
              from={{ x: 200, y: 168 }}
              to={streamTarget}
              mode="stream-email"
              highlight
              index={99}
            />
          )}
        </g>

        {NODES.map((node) => (
          <NetworkNode
            key={node.id}
            node={node}
            pull={pulls[node.id] ?? { x: 0, y: 0 }}
            mode={mode}
            active={
              mode === 'stream-email' &&
              (node.id === 'core' || node.id === 'relay-b' || node.id === 'stock')
            }
          />
        ))}

        {mode === 'breach' && (
          <circle
            cx="200"
            cy="168"
            r="42"
            fill="none"
            stroke="rgb(239 68 68 / 0.45)"
            strokeWidth="2"
            className="animate-ping"
          />
        )}
      </svg>
    </div>
  )
}
