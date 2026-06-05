import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 600,
          color: '#f5f5f5',
          letterSpacing: -0.5,
        }}
      >
        o
      </div>
    ),
    { ...size }
  )
}
