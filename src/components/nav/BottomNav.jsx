import { Compass, Rss, Bookmark, BookOpen, UserRound } from 'lucide-react'
import { NavTabBar } from '../ui/Tab'
import styles from './BottomNav.module.css'

const ITEMS = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'library', label: 'Library', icon: Bookmark },
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'you', label: 'You', icon: UserRound },
]

// Phase 2b (BINGR_UI_AUDIT.md GP-nav / BINGR_DESIGN_SYSTEM.md's nav
// section) — replaces the old nine-tab horizontal scroll strip. Mobile
// only; SideRail.jsx is the >=1024px equivalent.
export default function BottomNav({ tab, onSelectTab }) {
  return (
    <nav className={styles.bottomNav}>
      <NavTabBar items={ITEMS} value={tab} onChange={onSelectTab} />
    </nav>
  )
}
