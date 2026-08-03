import { Calendar } from 'lucide-react'
import styles from './ActivityChart.module.css'

export default function ActivityChart({ months, height = 90, barHeight = 64 }) {
  const max = Math.max(...months.map(m => m.count), 1)
  return (
    <div>
      <div className={styles.title}><Calendar size={16} /> Activity — last 12 months</div>
      <div className={styles.chart} style={{ height }}>
        {months.map(m => {
          const pct = m.count / max
          const h = Math.max(pct * barHeight, m.count > 0 ? 6 : 2)
          return (
            <div key={m.key} className={styles.col}>
              {m.count > 0 && <div className={styles.count}>{m.count}</div>}
              <div className={[styles.bar, m.count > 0 ? styles.barActive : ''].filter(Boolean).join(' ')} style={{ height: `${h}px`, opacity: m.count > 0 ? 1 : 0.4 }} />
              <div className={styles.monthLabel}>{m.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
