import { Compass, Rss, Bookmark, BookOpen, UserRound } from 'lucide-react'
import styles from './SideRail.module.css'

const ITEMS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'library', label: 'Library', icon: Bookmark },
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'you', label: 'You', icon: UserRound },
]

// Desktop (>=1024px) equivalent of BottomNav.jsx — same five destinations,
// persistent left rail with always-visible labels per
// BINGR_DESIGN_SYSTEM.md's nav section desktop-expansion note.
export default function SideRail({ tab, onSelectTab, onGoHome }) {
  return (
    <nav className={styles.rail}>
      <button className={styles.brand} onClick={onGoHome}>
        <img src="/logo.png" alt="" className={styles.brandLogo} />
        <span className={styles.brandName}>bingr</span>
      </button>
      {ITEMS.map(item => {
        const Icon = item.icon
        const active = item.id === tab
        return (
          <button
            key={item.id}
            className={[styles.item, active ? styles.itemActive : ''].filter(Boolean).join(' ')}
            onClick={() => onSelectTab(item.id)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
