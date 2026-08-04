import { BarChart3, Trophy, Layers, Coffee, Settings } from 'lucide-react'
import StatsPage from './StatsPage'
import Rankings from './Rankings'
import ListsPage from './ListsPage'
import SupportSection from '../components/SupportSection'
import Avatar from '../components/ui/Avatar'
import { PageTabBar } from '../components/ui/Tab'
import { accountMenuItems } from '../components/nav/accountMenuItems'
import styles from './YouHub.module.css'

const TABS = [
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'lists', label: 'Lists', icon: Layers },
  { id: 'support', label: 'Support', icon: Coffee },
  { id: 'account', label: 'Account', icon: Settings },
]

function AccountRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={[styles.accountRow, danger ? styles.accountRowDanger : ''].filter(Boolean).join(' ')}>
      <Icon size={18} />
      {label}
    </button>
  )
}

// RD6 (BINGR_UI_AUDIT.md) — Stats and Rankings used to be siblings of
// Discover in the main nav; they're about *your* data, not things to
// browse, so they live here instead. Lists folds in for the same reason.
// Support (formerly a floating button — see SupportSection.jsx) lives here
// too now that it no longer needs its own thumb-zone real estate.
//
// The Account tab replaces the old header avatar dropdown (Phase 2b) —
// per BINGR_DESIGN_SYSTEM.md's nav section, the avatar now opens this same
// hub instead of a separate floating menu, so profile/settings live in
// exactly one place, reachable two ways.
export default function YouHub({
  session, profile, library, diaryHook, episodeHook, listsHook,
  onOpenItem, onShowSupporters, onNavigate, onSignOut, onShowFeedback, isAdmin,
  tab, onTabChange, onGoDiscover,
}) {
  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]

  const accountHandlers = {
    'edit-profile': () => onNavigate('profile'),
    'view-public-profile': () => { window.location.href = `/@${profile?.username}` },
    admin: () => onNavigate('admin'),
    feedback: onShowFeedback,
    supporters: onShowSupporters,
    'sign-out': onSignOut,
    'delete-account': () => onNavigate('delete-account'),
  }

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
      {tab === 'account' && (
        <div className={styles.accountList}>
          {accountMenuItems({ isAdmin }).map(item => (
            <AccountRow key={item.id} icon={item.icon} label={item.label} danger={item.danger} onClick={accountHandlers[item.id]} />
          ))}
        </div>
      )}
    </div>
  )
}
