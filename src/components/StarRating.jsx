import { useState } from 'react'
import { Star } from 'lucide-react'
import { RATING_LABELS as LABELS } from '../lib/constants'
import styles from './StarRating.module.css'

export default function StarRating({ value = 0, onChange, size = 22 }) {
  const [hovered, setHovered] = useState(0)
  const [justRated, setJustRated] = useState(false)
  const display = hovered || value

  const handleClick = (n) => {
    onChange(n)
    setJustRated(true)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stars}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onAnimationEnd={() => setJustRated(false)}
            className={[styles.star, display >= n ? styles.starFilled : '', justRated && n === value ? styles.starPop : ''].filter(Boolean).join(' ')}
          >
            <Star size={size} fill={display >= n ? 'currentColor' : 'none'} strokeWidth={display >= n ? 0 : 1.5} />
          </button>
        ))}
      </div>
      <span className={styles.label}>{display ? `${display}/10 — ${LABELS[display]}` : 'Tap to rate'}</span>
    </div>
  )
}
