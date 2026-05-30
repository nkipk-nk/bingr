import { useState } from 'react'

const LABELS = ['','Terrible','Poor','Disappointing','Below average','Average','Decent','Good','Great','Excellent','Masterpiece']

export default function StarRating({ value = 0, onChange, size = 22 }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            style={{
              fontSize: size, background: 'none', border: 'none', cursor: 'pointer',
              color: display >= n ? '#ef9f27' : 'var(--border-strong)',
              padding: '0 1px', lineHeight: 1,
              transition: 'color 0.1s, transform 0.1s',
              transform: hovered === n ? 'scale(1.2)' : 'scale(1)',
            }}
          >★</button>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {display ? `${display}/10 — ${LABELS[display]}` : 'Tap to rate'}
      </span>
    </div>
  )
}
