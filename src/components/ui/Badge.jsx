import styles from './Badge.module.css'

// §8 Badge spec (generic pill — see StatusPill/RatingBadge for the two
// dedicated domain variants): radius-pill, uppercase body-xs.
export default function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return (
    <span className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}
