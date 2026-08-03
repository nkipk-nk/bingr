import Card from '../ui/Card'
import styles from './StatTile.module.css'

// RD6 (BINGR_UI_AUDIT.md) — the stat-tile grid used to be independently
// hand-rolled in StatsPage and UserProfilePage's stats tab. One component,
// two compositions: StatsPage renders all tiles + the owner-only Wrapped
// hero; the public profile renders a deliberate subset.
export function StatTile({ icon: Icon, value, label, sub }) {
  return (
    <Card className={styles.tile}>
      {Icon && <Icon size={22} className={styles.icon} />}
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </Card>
  )
}

export function StatTileGrid({ tiles }) {
  return (
    <div className={styles.grid}>
      {tiles.map(t => <StatTile key={t.label} {...t} />)}
    </div>
  )
}
