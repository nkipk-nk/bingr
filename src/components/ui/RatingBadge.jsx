import { Star } from 'lucide-react'
import styles from './RatingBadge.module.css'

// §8 Badge spec (rating variant): gold at 15% opacity fill, gold text, mono.
export default function RatingBadge({ rating, max = 10, className = '', ...props }) {
  return (
    <span className={[styles.badge, className].filter(Boolean).join(' ')} {...props}>
      <Star size={12} fill="currentColor" strokeWidth={0} />
      {rating}/{max}
    </span>
  )
}
