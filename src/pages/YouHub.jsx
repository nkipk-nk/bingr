import { BarChart3, Trophy, Layers, Coffee } from 'lucide-react'
import StatsPage from './StatsPage'
import Rankings from './Rankings'
import ListsPage from './ListsPage'
import SupportSection from '../components/SupportSection'
import Avatar from '../components/ui/Avatar'
import { PageTabBar } from '../components/ui/Tab'
import styles from './YouHub.module.css'

const TABS = [
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'lists', label: 'Lists', icon: Layers },
  { id: 'support', label: 'Support', icon: Coffee },
]

// RD6 (BINGR_UI_AUDIT.md) — Stats and Rankings used to be siblings of
// Discover in the main nav; they're about *your* data, not things to
// browse, so they live here instead. Lists folds in for the same reason.
// Support (formerly a floating button — see SupportSection.jsx) lives here
// too now that it no longer needs its own thumb-zone real estate.
//
// RD11 (BINGR_UI_AUDIT.md) — this hub used to have a 5th "Account" tab that
// re-listed the exact same profile/settings/sign-out items already in the
// header's AccountMenu dropdown (accountMenuItems.js), reachable at every
// viewport since Header renders the avatar regardless of screen width — not
// two legitimate paths to the same place, just one menu duplicated. Removed
// rather than kept in sync.
export default function YouHub({
  session, profile, library, diaryHook, episodeHook, listsHook,
  onOpenItem, onShowSupporters, tab, onTabChange, onGoDiscover,
}) {
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]

  return (
    <div>
      <div className={styles.header}>
        <Avatar size="lg" name={userDisplay} />
        <div>
          <div className={styles.name}>{userDisplay}</div>
          {profile?.username && <div className={styles.handle}>@{profile.username}</div>}
        </div>
      </div>

      <PageTabBar className={styles.tabs} value={tab} onChange={onTabChange} items={TABS.map(t => ({ id: t.id, label: t.label }))} />

      {tab === 'stats' && <StatsPage library={library} diary={diaryHook.entries} episodes={episodeHook.episodes} onGoDiscover={onGoDiscover} />}
      {tab === 'rankings' && <Rankings library={library} onOpen={onOpenItem} onGoDiscover={onGoDiscover} />}
      {tab === 'lists' && <ListsPage listsHook={listsHook} onOpenItem={onOpenItem} />}
      {tab === 'support' && <SupportSection session={session} profile={profile} onShowSupporters={onShowSupporters} />}
    </div>
  )
}
