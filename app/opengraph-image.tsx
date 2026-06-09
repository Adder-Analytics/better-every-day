import { ImageResponse } from 'next/og'
import { currentDay, latestEntry } from '@/data/changelog'

export const alt = 'Better Every Day — a daily planner that improves every day'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  const entry = latestEntry()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#09090b',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: '#10b981',
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 600, color: '#fafafa' }}>Better Every Day</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 180, fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
            {`Day ${currentDay()}`}
          </div>
          {/* No emoji here: Satori has no emoji font and drops the glyph */}
          <div style={{ fontSize: 52, fontWeight: 600, color: '#fafafa', marginTop: 28 }}>
            {entry.title}
          </div>
        </div>

        <div style={{ fontSize: 28, color: '#71717a' }}>
          A tiny daily planner that ships one improvement every single day.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
