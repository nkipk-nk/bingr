import { useEffect, useRef } from 'react'
import Avatar from '../ui/Avatar'
import { accountMenuItems } from './accountMenuItems'
import styles from './AccountMenu.module.css'

function MenuRow({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={[styles.row, danger ? styles.rowDanger : ''].filter(Boolean).join(' ')}>
      <Icon size={16} />
      {label}
    </button>
  )
}

// Real user testing on the deployed app found the avatar-navigates-directly-
// to-a-hub pattern (a deliberate Phase 2b call, trading a second menu for
// "exactly one place profile/settings lives") reads as a mobile pattern
// that doesn't fit desktop, where a proper anchored dropdown is the
// expected affordance. See accountMenuItems.js for the shared item list —
// the only remaining copy of this menu (RD13, BINGR_UI_AUDIT.md: the
// You-hub's own copy of it was removed, not just this one added).
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

  const handlers = {
    'account-settings': () => onNavigate('account-settings'),
    admin: () => onNavigate('admin'),
    feedback: onShowFeedback,
    supporters: () => onNavigate('supporters'),
    'sign-out': onSignOut,
    'delete-account': () => onNavigate('delete-account'),
  }
  const items = accountMenuItems({ isAdmin })
  const primaryItems = items.filter(i => i.id !== 'sign-out' && i.id !== 'delete-account')
  const dangerItems = items.filter(i => i.id === 'sign-out' || i.id === 'delete-account')

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
      {primaryItems.map(item => (
        <MenuRow
          key={item.id} icon={item.icon} label={item.label}
          onClick={item.id === 'my-profile' ? goToPublicProfile : go(handlers[item.id])}
        />
      ))}

      <div className={styles.divider} />
      {dangerItems.map(item => (
        <MenuRow key={item.id} icon={item.icon} label={item.label} onClick={go(handlers[item.id])} danger={item.danger} />
      ))}
    </div>
  )
}
