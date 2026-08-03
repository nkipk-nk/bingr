import { useState } from 'react'
import Skeleton from './Skeleton'
import styles from './PosterTile.module.css'

// §8 Poster tile spec — the most important primitive given the content
// domain. 3 sizes only (BINGR_UI_AUDIT.md CX1). md/lg get the hover-glow
// treatment; sm (list rows) doesn't.
export default function PosterTile({ src, alt = '', size = 'md', onClick, className = '', children, ...props }) {
  const [loaded, setLoaded] = useState(false)
  const hoverable = size !== 'sm'

  return (
    <div
      className={[styles.tile, styles[size], hoverable ? styles.hoverable : '', className].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      {...props}
    >
      {!loaded && <Skeleton shape={size === 'sm' ? 'rect' : 'poster'} width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} />}
      {src && (
        <img
          className={styles.img}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity var(--duration-base) var(--ease-standard)' }}
        />
      )}
      {children}
    </div>
  )
}
