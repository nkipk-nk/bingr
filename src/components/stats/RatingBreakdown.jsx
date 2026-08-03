import { Star } from 'lucide-react'
import styles from './RatingBreakdown.module.css'

export default function RatingBreakdown({ dist }) {
  const max = Math.max(...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => dist[n] || 0), 1)
  return (
    <div>
      <div className={styles.title}><Star size={16} /> Rating breakdown</div>
      <div className={styles.rows}>
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => {
          const color = n >= 8 ? 'var(--success)' : n >= 5 ? 'var(--warning)' : 'var(--danger)'
          const pct = ((dist[n] || 0) / max) * 100
          return (
            <div key={n} className={styles.row}>
              <div className={styles.num}>{n}</div>
              <div className={styles.track}><div className={styles.fill} style={{ width: `${pct}%`, background: color }} /></div>
              <div className={styles.count}>{dist[n] || ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
