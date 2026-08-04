import { useEffect, useRef } from 'react'
import { UserRound, IdCard, Settings, MessageCircle, Sparkles, Lock, FileText, LogOut, AlertTriangle } from 'lucide-react'
import Avatar from '../ui/Avatar'
import styles from './AccountMenu.module.css'

function MenuRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={[styles.row, danger ? styles.rowDanger : ''].filter(Boolean).join(' ')}>
      <Icon size={16} />
      {label}
    </button>
  )
}

// Real user testing on the deployed app found the avatar-navigates-to-the-
// You-hub pattern (a deliberate Phase 2b call, trading a second menu for
// "exactly one place profile/settings lives") reads as a mobile pattern
// that doesn't fit desktop, where a proper anchored dropdown is the
// expected affordance. Same actions YouHub's Account tab already has —
// that tab isn't removed, this is just also reachable from the header.
export default function AccountMenu({ profile, session, isAdmin, onClose, onNavigate, onShowFeedback, onSignOut }) {
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const userDisplay = profile?.display_name || profile?.username || session.user.email.split('@')[0]
  const go = (fn) => () => { fn(); onClose() }
  const goToPublicProfile = () => { window.location.href = `/@${profile?.username}`; onClose() }

  return (
    <div ref={ref} className={styles.menu} role="menu">
      <div className={styles.header}>
        <Avatar size="md" name={userDisplay} />
        <div className={styles.headerText}>
          <div className={styles.name}>{userDisplay}</div>
          {profile?.username && <div className={styles.handle}>@{profile.username}</div>}
        </div>
      </div>

      <div className={styles.divider} />
      <MenuRow icon={UserRound} label="Edit profile" onClick={go(() => onNavigate('profile'))} />
      <MenuRow icon={IdCard} label="View public profile" onClick={goToPublicProfile} />
      {isAdmin && <MenuRow icon={Settings} label="Admin panel" onClick={go(() => onNavigate('admin'))} />}
      {!isAdmin && <MenuRow icon={MessageCircle} label="Send feedback" onClick={go(onShowFeedback)} />}
      <MenuRow icon={Sparkles} label="Supporters" onClick={go(() => onNavigate('supporters'))} />

      <div className={styles.divider} />
      <MenuRow icon={Lock} label="Privacy Policy" onClick={go(() => onNavigate('privacy'))} />
      <MenuRow icon={FileText} label="Terms of Service" onClick={go(() => onNavigate('terms'))} />

      <div className={styles.divider} />
      <MenuRow icon={LogOut} label="Sign out" onClick={go(onSignOut)} />
      <MenuRow icon={AlertTriangle} label="Delete account" onClick={go(() => onNavigate('delete-account'))} danger />
    </div>
  )
}
